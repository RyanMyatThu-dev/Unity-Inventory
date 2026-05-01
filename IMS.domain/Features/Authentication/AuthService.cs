using IMS.Database.IMSDbContextModels;
using IMS.Domain.Features.Authentication.Models;
using IMS.Domain.Features.Authentication.Tokens;
using IMS.Domain.Features.Business;
using IMS.shared;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace IMS.Domain.Features.Authentication
{
    public class AuthService : IAuthService
    {
        private readonly IMSDbContext _db;
        private readonly IConfiguration _configuration;
        private readonly ITokenService _tokenService;
        private readonly IBusinessService _businessService;

        public AuthService(IMSDbContext db, IConfiguration configuration, ITokenService tokenService, IBusinessService businessService)
        {
            _db = db;
            _configuration = configuration;
            _tokenService = tokenService;
            _businessService = businessService;
        }

        public async Task<Result<TokenResponse>> LoginAsync(LoginRequest request)
        {
            var user = await _db.TblUsers.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null) return Result<TokenResponse>.Failure("Invalid email or password.");

            if(!(BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))){
                return Result<TokenResponse>.Failure("Invalid email or password.");
            }

            var accessToken = _tokenService.GenerateAccessToken(user, null, null);
            var refreshToken = _tokenService.GenerateRefreshToken();
            var expirydays = int.Parse(_configuration["JwtSettings:RefreshTokenExpiryDays"] ?? "7");
            var businesses = await _businessService.GetBusinessesByUserIdAsync(user.UserId);
            var userToken = new TblUserToken
            {
                UserId = user.UserId,
                RefreshToken = refreshToken,
                TokenHash = HashToken(refreshToken),
                ExpiryDate = DateTime.UtcNow.AddDays(expirydays),
                IsRevoked = false,
                CreatedAt = DateTime.UtcNow,
            };

            _db.TblUserTokens.Add(userToken);
            await _db.SaveChangesAsync();   

            return Result<TokenResponse>.Success(new TokenResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                Email = user.Email,
                Businesses = businesses.Data ?? new List<BusinessAccessDto>()
            });

        }

        public async Task<Result<TokenResponse>> RefreshTokenAsync(RefreshTokenRequest request)
        {
            var hashedToken = HashToken(request.RefreshToken);
            var userToken = await _db.TblUserTokens
               .Include(ut => ut.User)
               .FirstOrDefaultAsync(ut => ut.TokenHash == hashedToken && (ut.IsRevoked != true) && ut.ExpiryDate > DateTime.UtcNow);

            if (userToken == null) return Result<TokenResponse>.Failure("Invalid or expired refresh token.");

            var user = userToken.User;
            if (user == null) return Result<TokenResponse>.Failure("User not found.");

            // Revoke the old token
            userToken.IsRevoked = true;

            // Generate new tokens
            var accessToken = _tokenService.GenerateAccessToken(user, null, null);
            var refreshToken = _tokenService.GenerateRefreshToken();
            var expirydays = int.Parse(_configuration["JwtSettings:RefreshTokenExpiryDays"] ?? "7");

            var newUserToken = new TblUserToken
            {
                UserId = user.UserId,
                RefreshToken = refreshToken,
                TokenHash = HashToken(refreshToken),
                ExpiryDate = DateTime.UtcNow.AddDays(expirydays),
                IsRevoked = false,
                CreatedAt = DateTime.UtcNow
            };

            _db.TblUserTokens.Add(newUserToken);
            await _db.SaveChangesAsync();

            var businesses = await _businessService.GetBusinessesByUserIdAsync(user.UserId);

            return Result<TokenResponse>.Success(new TokenResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                Email = user.Email,
                Businesses = businesses.Data ?? new List<BusinessAccessDto>()
            });
        }

        private string HashToken(string token)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(token));
            return Convert.ToBase64String(hashedBytes);
        }
    }
}

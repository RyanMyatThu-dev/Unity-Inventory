using Unity_Inventory.Database.IMSDbContextModels;
using Unity_Inventory.Domain.Features.Authentication.Models;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Unity_Inventory.Domain.Features.Authentication.Tokens
{
    public class TokenService : ITokenService
    {
        private readonly IMSDbContext _db;
        private readonly IConfiguration _configuration;
        public TokenService(IMSDbContext db, IConfiguration configuration)
        {
            _db = db;
            _configuration = configuration;
        }

        public async Task<string> GenerateAccessTokenAsync(TblUser user, int? businessId, string? role = null)
        {
            var JWTConfig = _configuration.GetSection("JwtSettings");
            var secretKey = JWTConfig["SecretKey"] ?? throw new InvalidOperationException("Secret Key Not Found!");
            var issuer = JWTConfig["Issuer"] ?? throw new InvalidOperationException("Issuer Not Found!");
            var audience = JWTConfig["Audience"] ?? throw new InvalidOperationException("Audience Not Found!");
            var expiryMinutes = int.Parse(JWTConfig["AccessTokenExpiryMinutes"] ?? throw new InvalidOperationException("Expiry Minutes Not Found!"));

            var secret = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var signingCredentials = new SigningCredentials(secret, SecurityAlgorithms.HmacSha256);

            List<Claim> claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("AccountType", user.AccountType ?? string.Empty)
            };

            if (businessId.HasValue)
            {
                claims.Add(new Claim("BusinessId", businessId.Value.ToString()));
            }

            if (!string.IsNullOrEmpty(role))
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            if (businessId.HasValue)
            {
                var permissions = await GetUserPermissionsAsync(user.UserId, businessId.Value, role);
                foreach (var permission in permissions)
                {
                    claims.Add(new Claim("Permission", permission));
                }
            }

            var token = new JwtSecurityToken(
                
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: signingCredentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private async Task<List<string>> GetUserPermissionsAsync(int userId, int businessId, string? role)
        {
            return await _db.TblRolePermissions
                .AsNoTracking()
                .Where(rp => rp.BusinessId == businessId)
                .Where(rp => (rp.UserId == userId && rp.RoleName == role) || (rp.UserId == userId) || (rp.RoleName == role))
                .Where(rp => rp.IsAllowed && !rp.IsRevoked)
                .Select(rp => $"{rp.MenuCode}.{rp.ActionCode}")
                .Distinct()
                .ToListAsync();
             
        }
        public string GenerateRefreshToken()
        {
            var random = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(random);
            return Convert.ToBase64String(random);
        }

        
    }
}

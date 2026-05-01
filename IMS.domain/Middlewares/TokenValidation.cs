using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.IdentityModel.Tokens;
using System.Runtime.InteropServices;
using Microsoft.Extensions.DependencyInjection;
using IMS.Domain.Features.Authentication;
using IMS.Domain.Features.Authentication.Models;

namespace IMS.Shared.Middlewares
{
    public class TokenValidation
    {
        private readonly RequestDelegate _next;
        private readonly IConfiguration _configuration;

        public TokenValidation(RequestDelegate next, IConfiguration configuration)
        {
            _next = next;
            _configuration = configuration;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var path = context.Request.Path.Value?.ToLower();
            if (path != null && (path.Contains("/api/auth/login") || path.Contains("/api/auth/register")))
            {
                await _next(context);
                return;
            }

            var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
            bool isTokenValid = false;
            if (!string.IsNullOrEmpty(token))
            {
                isTokenValid = ValidateToken(token, context);
            }
            if (!isTokenValid)
            {
                var refreshToken = context.Request.Cookies["refreshToken"];
                if (!string.IsNullOrEmpty(refreshToken))
                {
                    try
                    {
                        var authService = context.RequestServices.GetRequiredService<IAuthService>();
                        var res = await authService.RefreshTokenAsync(new RefreshTokenRequest { RefreshToken = refreshToken });

                        if (res != null)
                        {
                            ValidateToken(res.Data.AccessToken, context);
                            context.Response.Cookies.Append("X-Access-Token", res.Data.AccessToken);

                            var cookieOptions = new CookieOptions
                            {
                                HttpOnly = true,
                                Secure = true,
                                SameSite = SameSiteMode.Strict,
                                Expires = DateTime.UtcNow.AddDays(7)
                            };

                            context.Response.Cookies.Append("refreshToken", res.Data.RefreshToken, cookieOptions);

                        }


                    }
                    catch (Exception ex)
                    {
                        // Handler errors here
                    }

                }

            }
            await _next(context);

        }

        private bool ValidateToken(string token, HttpContext context)
        {
            try
            {
                var JWTConfig = _configuration.GetSection("JwtSettings");
                var secretKey = JWTConfig["SecretKey"] ?? throw new InvalidOperationException("Secret Key Not Found!");
                var key = Encoding.UTF8.GetBytes(secretKey);

                var principal = new JwtSecurityTokenHandler().ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = JWTConfig["Issuer"],
                    ValidAudience = JWTConfig["Audience"],
                    IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(key),
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                context.User = principal;
                return true;
            }
            catch (Exception ex)
            {
                // Handle token validation errors here
                return false;
            }
        }
    }
}

using IMS.Domain.Features.Authentication.Models;
using IMS.shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IMS.Domain.Features.Authentication
{
    public interface IAuthService
    {
        Task<Result<TokenResponse>> LoginAsync(LoginRequest request);
        Task<Result<TokenResponse>> RefreshTokenAsync(RefreshTokenRequest request);

    }
}

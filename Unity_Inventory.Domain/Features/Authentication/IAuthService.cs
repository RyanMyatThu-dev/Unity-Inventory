using Unity_Inventory.Domain.Features.Authentication.Models;
using Unity_Inventory.Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Unity_Inventory.Domain.Features.Authentication
{
    public interface IAuthService
    {
        Task<Result<TokenResponse>> LoginAsync(LoginRequest request);
        Task<Result<TokenResponse>> RefreshTokenAsync(RefreshTokenRequest request);

    }
}

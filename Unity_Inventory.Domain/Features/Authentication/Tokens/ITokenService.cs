using Unity_Inventory.Database.IMSDbContextModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Unity_Inventory.Domain.Features.Authentication.Tokens
{
    public interface ITokenService
    {
        Task<string> GenerateAccessTokenAsync(TblUser user, int? businessId, string? role = null);
        string GenerateRefreshToken();
    }
}

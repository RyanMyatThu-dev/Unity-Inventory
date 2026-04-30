using IMS.Database.IMSDbContextModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IMS.Domain.Features.Authentication.Tokens
{
    public interface ITokenService
    {
        string GenerateAccessToken(TblUser user, int? businessId, string? role = null);
        string GenerateRefreshToken();
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Unity_Inventory.Domain.Features.Authorization.Models;
using Unity_Inventory.Shared;

namespace Unity_Inventory.Domain.Features.Authorization
{
    public interface IPermissionService
    {
        Task<Result<bool>> HasPermissionAsync(CheckPermissionRequest request);
        Task SeedDefaultRolePermissionsForBusinessAsync(int businessId, int grantedByUserId);
        Task<Result<bool>> GrantPermissionAsync(GrantPermissionRequest request);

        Task<Result<bool>> RevokePermissionAsync(RevokePermissionRequest request);
        Task<Result<IEnumerable<RolePermissionDTO>>> GetUserPermissionsAsync(int businessId, int userId, string roleName);
    }
}

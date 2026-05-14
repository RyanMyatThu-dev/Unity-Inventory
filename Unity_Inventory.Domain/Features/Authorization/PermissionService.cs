using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using Unity_Inventory.Database.IMSDbContextModels;
using Unity_Inventory.Domain.Features.Authorization.Models;
using Unity_Inventory.Shared;

namespace Unity_Inventory.Domain.Features.Authorization
{
    public class PermissionService : IPermissionService
    {
        private readonly IMSDbContext _db;

        #region For auto generation of base permissions for Staff role when a new business is created. Not used elsewhere in code.

        private static readonly (string Menu, string Action)[] StaffPermissions =
        [
            ("dashboard", "view"),
            ("inventory", "view"),
            ("customers", "view"),
            ("sales", "view"),
            ("sales", "create"),
            ("customerprices", "view"),
        ];

        private static readonly string[] Menus =
        [
            "dashboard",
            "inventory",
            "customers",
            "sales",
            "customerprices",
            "users",
            "business",
        ];

        private static readonly string[] Actions = ["view", "create", "edit", "delete"];

        #endregion
        public PermissionService(IMSDbContext db)
        {
            _db = db;
        }

        #region For auto generation of base permissions for Staff role when a new business is created. Not used elsewhere in code.
        public async Task SeedDefaultRolePermissionsForBusinessAsync(int businessId, int grantedByUserId)
        {
            var list = new List<TblRolePermission>();
            var now = DateTime.UtcNow;

            void Add(string role, string menu, string action)
            {
                list.Add(new TblRolePermission
                {
                    BusinessId = businessId,
                    UserId = null,
                    RoleName = role,
                    MenuCode = menu,
                    ActionCode = action,
                    IsAllowed = true,
                    IsRevoked = false,
                    GrantedByUserId = grantedByUserId,
                    RevokedByUserId = null,
                    RevokedAt = null,
                    CreatedAt = now,
                });
            }

            foreach (var menu in Menus)
            foreach (var action in Actions)
                Add("Owner", menu, action);

            foreach (var menu in Menus)
            foreach (var action in Actions)
            {
                if (menu == "users" && action == "delete")
                    continue;
                if (menu == "business" && action == "delete")
                    continue;
                Add("Admin", menu, action);
            }

            foreach (var (menu, action) in StaffPermissions)
                Add("Staff", menu, action);

            _db.TblRolePermissions.AddRange(list);
            await _db.SaveChangesAsync();
        }
        #endregion

        #region Check if a permission exists for the given user or role. User-specific permissions take precedence over role-based permissions. If a permission is revoked, it denies access regardless of other permissions.
        public async Task<Result<bool>> HasPermissionAsync(CheckPermissionRequest request)
        {
            if (request.RoleName == "Owner")
                return Result<bool>.Success(true, "Owner bypass allowed.");

            var permissions = await _db.TblRolePermissions
            .AsNoTracking()
            .Where(rp => rp.BusinessId == request.BusinessId)
            .Where(rp => rp.MenuCode == request.MenuCode && rp.ActionCode == request.ActionCode)
            .Where(rp => (request.UserId != null && rp.UserId == request.UserId) || (rp.RoleName == request.RoleName))
            .ToListAsync();

            var userOverride = permissions.FirstOrDefault(p => p.UserId == request.UserId);
            if (userOverride != null)
            {
                if (userOverride.IsRevoked) return Result<bool>.Success(false, "Access rejected by user override");
                return Result<bool>.Success(userOverride.IsAllowed, "Access granted by user override");
            }
            var rolePerm = permissions.FirstOrDefault(p => p.RoleName == request.RoleName && p.UserId == null);
            if (rolePerm != null)
            {
                if (rolePerm.IsRevoked) return Result<bool>.Success(false, "Access denied by role");
                return Result<bool>.Success(rolePerm.IsAllowed, "Access granted by role");
            }

            return Result<bool>.Success(false, "Permission not found");
        }


        #endregion

        #region Grant or revoke permissions for a user or role. When granting a permission, if it already exists and is revoked, it will be updated to allowed. When revoking a permission, if it exists and is allowed, it will be updated to revoked. If the permission does not exist when revoking, a new revoked permission will be created to explicitly deny access.
        public async Task<Result<bool>> RevokePermissionAsync(RevokePermissionRequest request)
        { 

            if(request.RoleName == "Owner")
            {
                return Result<bool>.Failure("Cannot revoke permissions from Owner role");
            }

                var permission = await _db.TblRolePermissions
                    .Where(rp => rp.BusinessId == request.BusinessId)
                    .Where(rp => rp.MenuCode == request.MenuCode && rp.ActionCode == request.ActionCode)
                    .Where(rp => rp.UserId != null && rp.UserId == request.UserId)
                    .FirstOrDefaultAsync();

                if(permission != null)
                {
                    permission.IsAllowed = false;
                    permission.IsRevoked = true;
                    permission.RevokedByUserId = request.RevokedByUserId;
                    permission.RevokedAt = DateTime.UtcNow;
                    _db.TblRolePermissions.Update(permission);
                    await _db.SaveChangesAsync();
                } else
            {
                var newRevokePermission = new TblRolePermission
                {
                    BusinessId = request.BusinessId,
                    UserId = request.UserId,
                    RoleName = request.RoleName,
                    MenuCode = request.MenuCode,
                    ActionCode = request.ActionCode,
                    IsAllowed = false,
                    IsRevoked = true,
                    GrantedByUserId = request.RevokedByUserId,
                    RevokedByUserId = request.RevokedByUserId,
                    RevokedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };
                _db.TblRolePermissions.Add(newRevokePermission);
                await _db.SaveChangesAsync();
            }
                return Result<bool>.Success(true, "Permission revoked successfully");

        }

        public async Task<Result<bool>> GrantPermissionAsync(GrantPermissionRequest request)
        {
            var roleHasIt = await _db.TblRolePermissions.AnyAsync(rp =>
        rp.BusinessId == request.BusinessId &&
        rp.RoleName == request.RoleName &&
        rp.UserId == null &&
        rp.MenuCode == request.MenuCode &&
        rp.ActionCode == request.ActionCode &&
        rp.IsAllowed == true &&
        rp.IsRevoked == false);

            if (roleHasIt && request.UserId != null)
            {
                return Result<bool>.Failure("Permission already exists");
            }

            var existing = await _db.TblRolePermissions.FirstOrDefaultAsync(rp =>
        rp.BusinessId == request.BusinessId &&
        rp.MenuCode == request.MenuCode &&
        rp.ActionCode == request.ActionCode &&
        rp.UserId == request.UserId &&
        rp.RoleName == request.RoleName);

            if (existing != null)
            {
                if (existing.IsAllowed && !existing.IsRevoked)
                    return Result<bool>.Failure("Permission already exists");

                existing.IsAllowed = true;
                existing.IsRevoked = false;
                existing.GrantedByUserId = request.GrantedByUserId;
                existing.UpdatedAt = DateTime.UtcNow;
                existing.RevokedAt = null;
                existing.RevokedByUserId = null;
                _db.TblRolePermissions.Update(existing);
            }
            else
            {

                var newPermission = new TblRolePermission
                {
                    BusinessId = request.BusinessId,
                    UserId = request.UserId,
                    RoleName = request.RoleName,
                    MenuCode = request.MenuCode,
                    ActionCode = request.ActionCode,
                    IsAllowed = true,
                    IsRevoked = false,
                    GrantedByUserId = request.GrantedByUserId,
                    RevokedByUserId = null,
                    RevokedAt = null,
                    CreatedAt = DateTime.UtcNow
                };
                _db.TblRolePermissions.Add(newPermission);
            }
            await _db.SaveChangesAsync();
            return Result<bool>.Success(true, "Permission granted successfully");
        }
        public async Task<Result<IEnumerable<RolePermissionDTO>>> GetUserPermissionsAsync(int businessId, int userId, string roleName)
        {
            var permissions = await _db.TblRolePermissions
                .AsNoTracking()
                .Where(rp => rp.BusinessId == businessId)
                .Where(rp => (rp.UserId == userId) || (rp.UserId == null && rp.RoleName == roleName))
                .ToListAsync();

            var resolved = permissions
                .GroupBy(p => new { p.MenuCode, p.ActionCode })
                .Select(g =>
                {
                    var userOverride = g.FirstOrDefault(p => p.UserId == userId);
                    if (userOverride != null)
                    {
                        return new RolePermissionDTO
                        {
                            MenuCode = userOverride.MenuCode,
                            ActionCode = userOverride.ActionCode,
                            IsAllowed = userOverride.IsAllowed,
                            IsRevoked = userOverride.IsRevoked
                        };
                    }
                    var rolePerm = g.FirstOrDefault(p => p.UserId == null);
                    return new RolePermissionDTO
                    {
                        MenuCode = rolePerm!.MenuCode,
                        ActionCode = rolePerm.ActionCode,
                        IsAllowed = rolePerm.IsAllowed,
                        IsRevoked = rolePerm.IsRevoked
                    };
                })
                .ToList();

            return Result<IEnumerable<RolePermissionDTO>>.Success(resolved, "Permissions retrieved");
        }
        #endregion
    }
}

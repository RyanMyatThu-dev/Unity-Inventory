using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Runtime.CompilerServices;
using System.Security;
using System.Security.Claims;
using Unity_Inventory.Database.IMSDbContextModels;
using Unity_Inventory.Domain.Features.Authorization;
using Unity_Inventory.Domain.Features.Authorization.Models;

namespace Unity_Inventory.Api.Filters
{
    public class PermissionAttribute : TypeFilterAttribute
    {
        public PermissionAttribute(string menuCode, string actionCode, bool checkFromDb = true) : base(typeof(PermissionFilter))
        {
            Arguments = new object[] { menuCode, actionCode, checkFromDb };
        }

        public class PermissionFilter : IAsyncAuthorizationFilter
        {
            private readonly string _menuCode;
            private readonly string _actionCode;
            private readonly bool _checkFromDb;
            private readonly IPermissionService _permissionService;
            public PermissionFilter(string menuCode, string actionCode, IPermissionService permissionService, bool checkFromDb = true)
            {
                _menuCode = menuCode;
                _actionCode = actionCode;
                _checkFromDb = checkFromDb;
                _permissionService = permissionService;
            }
            public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
            {
                var hasPermission = false;
                var userIdClaim = context.HttpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    context.Result = new ForbidResult();
                    return;
                }
                var businessIdClaim = context.HttpContext.User.Claims.FirstOrDefault(c => c.Type == "BusinessId");
                if (businessIdClaim == null || !int.TryParse(businessIdClaim.Value, out int businessId))
                {
                    context.Result = new ForbidResult();
                    return;
                }
                var roleClaim = context.HttpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role);

                if (_checkFromDb)
                {
                    var result = await _permissionService.HasPermissionAsync(new CheckPermissionRequest
                    {
                        UserId = userId,
                        BusinessId = businessId,
                        MenuCode = _menuCode,
                        ActionCode = _actionCode,
                        RoleName = roleClaim?.Value
                    });
                    hasPermission = result.Data;

                }
                else
                {
                    var requiredPermission = $"{_menuCode}.{_actionCode}".ToLower();

                    hasPermission = context.HttpContext.User.HasClaim("Permission", requiredPermission) ||
                                   context.HttpContext.User.HasClaim(c => c.Type == "Permissions" &&
                                                 c.Value.Contains(requiredPermission));
                }

                if (!hasPermission)
                {
                    context.Result = new ForbidResult();
                }
            }
        
        }

    }
}

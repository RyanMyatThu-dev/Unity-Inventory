using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Unity_Inventory.Domain.Features.Authorization;
using Unity_Inventory.Domain.Features.Authorization.Models;

namespace Unity_Inventory.Api.Controllers
{
    [ApiController]
    [Route("api/permissions")]
    [Authorize(Roles = "Owner")]
    public class PermissionsController : ControllerBase
    {
        private readonly IPermissionService _permissionService;

        public PermissionsController(IPermissionService permissionService)
        {
            _permissionService = permissionService;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            return userIdClaim != null ? int.Parse(userIdClaim.Value) : 0;
        }

        private bool IsOwner()
        {
            var accountType = User.FindFirst("AccountType")?.Value ?? string.Empty;
            return string.Equals(accountType, "Owner", StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(accountType);
        }

        [HttpGet("{businessId}/user/{userId}")]
        public async Task<IActionResult> GetUserPermissions(int businessId, int userId, [FromQuery] string roleName)
        {
            if (!IsOwner()) return Forbid();

            var result = await _permissionService.GetUserPermissionsAsync(businessId, userId, roleName ?? "Staff");
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("grant")]
        public async Task<IActionResult> GrantPermission([FromBody] GrantPermissionRequest request)
        {
            if (!IsOwner()) return Forbid();
            
            request.GrantedByUserId = GetCurrentUserId();
            var result = await _permissionService.GrantPermissionAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("revoke")]
        public async Task<IActionResult> RevokePermission([FromBody] RevokePermissionRequest request)
        {
            if (!IsOwner()) return Forbid();
            
            request.RevokedByUserId = GetCurrentUserId();
            var result = await _permissionService.RevokePermissionAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
    }
}

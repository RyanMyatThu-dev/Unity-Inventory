using Unity_Inventory.Domain.Features.Authentication.Models;
using Unity_Inventory.Domain.Features.Authentication.Tokens;
using Unity_Inventory.Domain.Features.Authentication.Users;
using Unity_Inventory.Domain.Features.Business;
using Unity_Inventory.Domain.Features.Business.Models;
using Unity_Inventory.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Unity_Inventory.Api.Controllers
{
    [Route("api/business")]
    [ApiController]
    public class BusinessController : ControllerBase
    {
        private readonly ITokenService _tokenService;
        private readonly IBusinessService _businessService;
        private readonly IUserService _userService;

        public BusinessController(ITokenService tokenService, IBusinessService businessService, IUserService userService)
        {
            _tokenService = tokenService;
            _businessService = businessService;
            _userService = userService;
        }

        //POST : api/business/create
        [Authorize]
        [HttpPost("create")]
        public async Task<IActionResult> CreateBusiness([FromBody] BusinessCreateRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            request.OwnerUserId = userId; // Override with authenticated user ID

            var result = await _businessService.CreateBusiness(request);
            if (result.IsSuccess)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [Authorize]
        [HttpGet("my-businesses")]
        public async Task<IActionResult> GetMyBusinesses()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var result = await _businessService.GetBusinessesByUserIdAsync(userId);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        //POST : api/business/switch-business/{businessId}
        [Authorize]
        [HttpPost($"switch-business/{{businessId}}")]
        public async Task<IActionResult> SwitchBusiness([FromRoute] int businessId)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var result = await _businessService.VerifyBusinessAccessAsync(userId, businessId);
            if (!result.IsSuccess) return Forbid();

            var user = await _userService.GetByIdAsync(userId);
            var accessToken = _tokenService.GenerateAccessToken(user.Data!, businessId, result.Data!.Role);
            var refreshToken = _tokenService.GenerateRefreshToken();

            var businesses = await _businessService.GetBusinessesByUserIdAsync(userId);

            return Ok(Result<TokenResponse>.Success(new TokenResponse {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                Email = user.Data!.Email,
                Role = result.Data!.Role,
                Businesses = businesses.Data ?? new List<BusinessAccessDto>()
            }));

        }
        }
}

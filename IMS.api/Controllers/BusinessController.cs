using IMS.Domain.Features.Authentication.Models;
using IMS.Domain.Features.Authentication.Tokens;
using IMS.Domain.Features.Authentication.Users;
using IMS.Domain.Features.Business;
using IMS.Domain.Features.Business.Models;
using IMS.shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace IMS.api.Controllers
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
            var result = await _businessService.CreateBusiness(request);
            if (result.IsSuccess)
            {
                return Ok(result);
            }
            return BadRequest(result);
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

            return Ok(Result<TokenResponse>.Success(new TokenResponse {
                
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                Email = user.Data!.Email,
                Role = result.Data!.Role,
            }));

        }
        }
}

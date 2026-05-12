using IMS.Domain.Features.Dashboard;
using IMS.Domain.Features.Dashboard.Models;
using IMS.shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace IMS.api.Controllers
{
    [Authorize]
    [Route("api/dashboard")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        // Get complete dashboard data for the current business

        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            var businessId = GetCurrentBusinessId();

            if (businessId == 0)
            {
                return BadRequest(Result<DashboardData>.Failure("Business ID not found."));
            }

            var result = await _dashboardService.GetDashboardDataAsync(businessId);

            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        // Get only Revenue summary
        [HttpGet("revenue")]
        public async Task<IActionResult> GetRevenue()
        {
            var businessId = GetCurrentBusinessId();
            if (businessId == 0) return BadRequest("Business ID not found.");

            var result = await _dashboardService.GetRevenueAsync(businessId);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        // Get only Customer Statistics
        [HttpGet("customers")]
        public async Task<IActionResult> GetCustomerStats()
        {
            var businessId = GetCurrentBusinessId();
            if (businessId == 0) return BadRequest("Business ID not found.");

            var result = await _dashboardService.GetCustomerStatsAsync(businessId);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        // Get only Product Statistics
        [HttpGet("products")]
        public async Task<IActionResult> GetProductStats([FromQuery] int topCount = 5)
        {
            var businessId = GetCurrentBusinessId();
            if (businessId == 0) return BadRequest("Business ID not found.");

            var result = await _dashboardService.GetProductStatsAsync(businessId, topCount);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        // Get only Sales Trends
        [HttpGet("trends")]
        public async Task<IActionResult> GetSalesTrends()
        {
            var businessId = GetCurrentBusinessId();
            if (businessId == 0) return BadRequest("Business ID not found.");

            var result = await _dashboardService.GetSalesTrendsAsync(businessId);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        #region Helper Method
        private int GetCurrentBusinessId()
        {
            var businessIdClaim = User.FindFirst("BusinessId")?.Value;
            return int.TryParse(businessIdClaim, out int id) ? id : 0;
        }
        #endregion
    }
}

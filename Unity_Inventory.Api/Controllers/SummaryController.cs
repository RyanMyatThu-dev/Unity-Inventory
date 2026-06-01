using Unity_Inventory.Domain.Features.Summary;
using Unity_Inventory.Domain.Features.Summary.Models;
using Unity_Inventory.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Unity_Inventory.Api.Filters;

namespace Unity_Inventory.Api.Controllers
{
    [Authorize]
    [Route("api/summary")]
    [ApiController]
    public class SummaryController : ControllerBase
    {
        private readonly ISummaryService _summaryService;

        public SummaryController(ISummaryService summaryService)
        {
            _summaryService = summaryService;
        }

        // Get sales summary with filtering options
        [HttpGet("sales")]
        [Permission("summary", "view")]
        public async Task<IActionResult> GetSalesSummary(
            [FromQuery] string summaryType, // DAILY, WEEKLY, MONTHLY, YEARLY
            [FromQuery] DateOnly? periodStartDate,
            [FromQuery] DateOnly? periodEndDate)
        {
            var businessId = GetCurrentBusinessId();
            if (businessId == 0)
                return BadRequest("Business ID not found.");

            // Validate summaryType
            if (string.IsNullOrEmpty(summaryType))
                summaryType = "MONTHLY"; // Default to monthly

            var validTypes = new[] { "DAILY", "WEEKLY", "MONTHLY", "YEARLY" };
            if (!validTypes.Contains(summaryType.ToUpper()))
                return BadRequest($"Invalid summary type. Valid types are: {string.Join(", ", validTypes)}");

            // If no dates provided, use current period based on summaryType
            DateOnly startDate, endDate;
            if (!periodStartDate.HasValue || !periodEndDate.HasValue)
            {
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                switch (summaryType.ToUpper())
                {
                    case "DAILY":
                        startDate = today;
                        endDate = today;
                        break;
                    case "WEEKLY":
                        // Start of week (Monday)
                        startDate = today.AddDays(-(int)today.DayOfWeek + (int)DayOfWeek.Monday);
                        endDate = startDate.AddDays(6);
                        break;
                    case "MONTHLY":
                        startDate = new DateOnly(today.Year, today.Month, 1);
                        endDate = startDate.AddMonths(1).AddDays(-1);
                        break;
                    case "YEARLY":
                        startDate = new DateOnly(today.Year, 1, 1);
                        endDate = new DateOnly(today.Year, 12, 31);
                        break;
                    default:
                        startDate = today;
                        endDate = today;
                        break;
                }
            }
            else
            {
                startDate = periodStartDate.Value;
                endDate = periodEndDate.Value;
            }

            var result = await _summaryService.GetSalesSummaryAsync(businessId, summaryType.ToUpper(), startDate, endDate);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        // Generate and store a sales summary (manual trigger)
        [HttpPost("sales/generate")]
        [Permission("summary", "create")]
        public async Task<IActionResult> GenerateSalesSummary(
            [FromBody] GenerateSummaryRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var businessId = GetCurrentBusinessId();
            if (businessId == 0)
                return BadRequest("Business ID not found.");

            // Validate summaryType
            if (string.IsNullOrEmpty(request.SummaryType))
                return BadRequest("Summary type is required.");

            var validTypes = new[] { "DAILY", "WEEKLY", "MONTHLY", "YEARLY" };
            if (!validTypes.Contains(request.SummaryType.ToUpper()))
                return BadRequest($"Invalid summary type. Valid types are: {string.Join(", ", validTypes)}");

            var result = await _summaryService.GenerateAndStoreSalesSummaryAsync(
                businessId,
                request.SummaryType.ToUpper(),
                request.PeriodStartDate,
                request.PeriodEndDate);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        // Get historical summaries
        [HttpGet("sales/history")]
        [Permission("summary", "view")]
        public async Task<IActionResult> GetSalesSummaryHistory(
            [FromQuery] string summaryType, // DAILY, WEEKLY, MONTHLY, YEARLY
            [FromQuery] int limit = 10)
        {
            var businessId = GetCurrentBusinessId();
            if (businessId == 0)
                return BadRequest("Business ID not found.");

            // For history, we might want to query TblSummaryArchive directly
            // For now, we'll return empty as this would require extending the service
            // In a full implementation, this would call _summaryService.GetSalesSummaryHistoryAsync
            return Ok(Result<List<SalesSummaryDto>>.Success(new List<SalesSummaryDto>()));
        }

        #region Helper Method
        private int GetCurrentBusinessId()
        {
            var businessIdClaim = User.FindFirst("BusinessId")?.Value;
            return int.TryParse(businessIdClaim, out int id) ? id : 0;
        }
        #endregion
    }

    // Request model for generating summaries
    public class GenerateSummaryRequest
    {
        public string SummaryType { get; set; } = null!; // DAILY, WEEKLY, MONTHLY, YEARLY
        public DateOnly PeriodStartDate { get; set; }
        public DateOnly PeriodEndDate { get; set; }
    }
}
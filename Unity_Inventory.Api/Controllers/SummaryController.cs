using Unity_Inventory.Domain.Features.Summary;
using Unity_Inventory.Domain.Features.Summary.Models;
using Unity_Inventory.Domain.Features.Inventories;
using Unity_Inventory.Shared;
using Microsoft.AspNetCore.Authorization;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Unity_Inventory.Api.Filters;
using Hangfire;
using Hangfire.Storage;
using System.ComponentModel.DataAnnotations;

namespace Unity_Inventory.Api.Controllers
{
    [Authorize(Roles = "Owner")]
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

            var validTypes = new[] { "DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM" };
            if (!validTypes.Contains(summaryType.ToUpper()))
                return BadRequest($"Invalid summary type. Valid types are: {string.Join(", ", validTypes)}");

            if (summaryType.ToUpper() == "CUSTOM" && (!periodStartDate.HasValue || !periodEndDate.HasValue))
                return BadRequest("Start and End dates are required for CUSTOM summary type.");

            // If no dates provided, use current period based on summaryType
            DateOnly startDate, endDate;
            if (!periodStartDate.HasValue || !periodEndDate.HasValue)
            {
                var today = DateOnly.FromDateTime(DateTime.Now);
                switch (summaryType.ToUpper())
                {
                    default:
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
                        // GenerateYearlySummariesAsync stores LAST YEAR (today.Year - 1),
                        // so the API default range must match that to keep graphs/archives consistent.
                        var lastYear = today.Year - 1;
                        startDate = new DateOnly(lastYear, 1, 1);
                        endDate = new DateOnly(lastYear, 12, 31);
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

        // Get status and execution details of Hangfire recurring summary compiler jobs
        [HttpGet("scheduler/status")]
        [Permission("summary", "view")]
        [ProducesResponseType(typeof(Result<object>), StatusCodes.Status200OK)]
        public IActionResult GetSchedulerStatus()
        {
            try
            {
                using var connection = JobStorage.Current.GetConnection();
                var recurringJobs = connection.GetRecurringJobs();
                
                var jobs = recurringJobs
                    .Where(j => j.Id.Contains("summary"))
                    .Select(j => new
                    {
                        JobId = j.Id,
                        Cron = j.Cron,
                        NextExecution = j.NextExecution,
                        LastExecution = j.LastExecution,
                        LastJobId = j.LastJobId,
                        LastJobState = j.LastJobState,
                        TimeZoneId = j.TimeZoneId,
                        Error = j.Error
                    }).ToList();

                return Ok(Result<object>.Success(jobs));
            }
            catch (Exception ex)
            {
                return BadRequest(Result<object>.Failure(ex.Message));
            }
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
                request.SummaryType!.ToUpper(),
                request.PeriodStartDate!.Value,
                request.PeriodEndDate!.Value);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        // Get historical summaries
        [HttpGet("sales/history")]
        [Permission("summary", "view")]
        public async Task<IActionResult> GetSalesSummaryHistory(
            [FromQuery] string summaryType, // DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM
            [FromQuery] int limit = 10)
        {
            var businessId = GetCurrentBusinessId();
            if (businessId == 0)
                return BadRequest("Business ID not found.");

            if (string.IsNullOrEmpty(summaryType))
                summaryType = "MONTHLY";

            var result = await _summaryService.GetSalesSummaryHistoryAsync(businessId, summaryType.ToUpper(), limit);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        // Analyze sales summary using Gemini AI
        [HttpPost("sales/analyze")]
        [Permission("summary", "analyze")]
        public async Task<IActionResult> AnalyzeSalesSummary(
            [FromBody] SalesSummaryDto summaryDto,
            [FromServices] IAiService aiService)
        {
            if (summaryDto == null)
                return BadRequest("Summary details are required.");

            var result = await aiService.AnalyzeSummaryAsync(summaryDto);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        // Interactive chat with AI Business Analyst Assistant
        [HttpPost("chat")]
        [Permission("summary", "view")]
        public async Task<IActionResult> ChatWithAnalyst(
            [FromBody] AiChatRequest request,
            [FromServices] IAiService aiService,
            [FromServices] IInventoryService inventoryService)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Message))
                return BadRequest("Message cannot be empty.");

            var businessId = GetCurrentBusinessId();
            if (businessId == 0)
                return BadRequest("Business ID not found.");

            // Calculate or fetch summary dates
            DateOnly startDate, endDate;
            if (!request.PeriodStartDate.HasValue || !request.PeriodEndDate.HasValue)
            {
                var today = DateOnly.FromDateTime(DateTime.Now);
                switch (request.SummaryType?.ToUpper() ?? "MONTHLY")
                {
                    default:
                        startDate = today;
                        endDate = today;
                        break;
                    case "WEEKLY":
                        startDate = today.AddDays(-(int)today.DayOfWeek + (int)DayOfWeek.Monday);
                        endDate = startDate.AddDays(6);
                        break;
                    case "MONTHLY":
                        startDate = new DateOnly(today.Year, today.Month, 1);
                        endDate = startDate.AddMonths(1).AddDays(-1);
                        break;
                    case "YEARLY":
                        var lastYear = today.Year - 1;
                        startDate = new DateOnly(lastYear, 1, 1);
                        endDate = new DateOnly(lastYear, 12, 31);
                        break;
                }
            }
            else
            {
                startDate = request.PeriodStartDate.Value;
                endDate = request.PeriodEndDate.Value;
            }

            var summaryResult = await _summaryService.GetSalesSummaryAsync(businessId, request.SummaryType?.ToUpper() ?? "MONTHLY", startDate, endDate);
            var summary = summaryResult.IsSuccess ? summaryResult.Data : null;

            var lowStockResult = await inventoryService.GetLowStockItemsAsync(businessId, threshold: 5);
            var lowStockItems = lowStockResult.IsSuccess ? lowStockResult.Data : null;

            var safeCustomerRanks = summary?.CustomerRanks?.Select(c => new
            {
                c.Rank,
                TotalRevenue = c.TotalRevenue,
                TotalOrders = c.TotalOrders,
                PercentageOfRevenue = c.PercentageOfRevenue
            }).ToList();

            var productRanks = summary?.ProductRanks?.Select(p => new
            {
                p.Rank,
                ProductName = p.ProductName,
                p.QuantitySold,
                p.Revenue,
                p.PercentageOfRevenue
            }).ToList();

            var safeLowStock = lowStockItems?.Select(i => new
            {
                ProductName = i.Name,
                Quantity = i.CurrentStock ?? 0,
                MinThreshold = 5
            }).ToList();

            var salesTrend = summary?.SalesTrend?.Select(t => new
            {
                t.Label,
                t.Revenue,
                t.Orders
            }).ToList();

            var contextData = new
            {
                PeriodType = request.SummaryType?.ToUpper() ?? "MONTHLY",
                StartDate = startDate,
                EndDate = endDate,
                OverallPerformance = summary != null ? new
                {
                    TotalRevenue = summary.TotalRevenue,
                    AverageOrderValue = summary.AverageOrderValue,
                    TotalOrders = summary.TotalOrders,
                    TotalItemsSold = summary.TotalItemsSold,
                    UniqueCustomers = summary.UniqueCustomers,
                    TopProductName = summary.TopProductName,
                    TopProductQuantitySold = summary.TopProductQuantitySold
                } : null,
                ProductPerformanceRanks = productRanks,
                CustomerSpendRanksSecure = safeCustomerRanks,
                LowStockAlerts = safeLowStock,
                SalesTrendVelocity = salesTrend
            };

            var businessContext = System.Text.Json.JsonSerializer.Serialize(contextData, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });

            var result = await aiService.ChatWithAnalystAsync(businessContext, request.Message, request.History ?? new List<ChatMessageDto>());
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

    // Request model for generating summaries
    public class GenerateSummaryRequest
    {
        [Required]
        public string? SummaryType { get; set; } // DAILY, WEEKLY, MONTHLY, YEARLY
        [Required]
        public DateOnly? PeriodStartDate { get; set; }
        [Required]
        public DateOnly? PeriodEndDate { get; set; }
    }

    // Request model for AI chat assistant
    public class AiChatRequest
    {
        public string Message { get; set; } = null!;
        public string SummaryType { get; set; } = "MONTHLY";
        public DateOnly? PeriodStartDate { get; set; }
        public DateOnly? PeriodEndDate { get; set; }
        public List<ChatMessageDto>? History { get; set; }
    }
}
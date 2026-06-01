using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Unity_Inventory.Domain.Features.Summary.Models;
using Unity_Inventory.Shared;

namespace Unity_Inventory.Domain.Features.Summary
{
    public interface ISummaryService
    {
        Task<Result<SalesSummaryDto>> GetSalesSummaryAsync(int businessId, string summaryType, DateOnly periodStartDate, DateOnly periodEndDate);
        Task<Result<SalesSummaryDto>> GenerateAndStoreSalesSummaryAsync(int businessId, string summaryType, DateOnly periodStartDate, DateOnly periodEndDate, string source = "API");
        Task<Result<List<SalesSummaryDto>>> GetSalesSummaryHistoryAsync(int businessId, string summaryType, int limit = 10);
        Task GenerateDailySummariesAsync();
        Task GenerateMonthlySummariesAsync();
        Task GenerateYearlySummariesAsync();
    }
}

using System.Threading.Tasks;
using Unity_Inventory.Domain.Features.Summary.Models;
using Unity_Inventory.Shared;

namespace Unity_Inventory.Domain.Features.Summary
{
    public interface IAiService
    {
        Task<Result<string>> AnalyzeSummaryAsync(SalesSummaryDto summary);
    }
}

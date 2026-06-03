using System.Collections.Generic;
using System.Threading.Tasks;
using Unity_Inventory.Domain.Features.Summary.Models;
using Unity_Inventory.Shared;

namespace Unity_Inventory.Domain.Features.Summary
{
    public interface IAiService
    {
        Task<Result<string>> AnalyzeSummaryAsync(SalesSummaryDto summary);
        Task<Result<string>> ChatWithAnalystAsync(string businessContext, string userMessage, List<ChatMessageDto> history);
    }
}

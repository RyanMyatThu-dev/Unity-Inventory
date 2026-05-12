using Unity_Inventory.Domain.Features.Sales.Models;
using Unity_Inventory.Shared;
using Unity_Inventory.Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Unity_Inventory.Domain.Features.Sales
{
    public interface ISalesService
    {
        Task<PagedResult<ReportDTO>> GetReportsByBusinessIdAsync(PaginationRequest paginationRequest, int businessId);
        Task<Result<ReportDTO>> GetReportByIdAsync(int id);
        Task<Result<ReportDTO>> CreateReportAsync(CreateReportRequest request);
        Task<Result<bool>> DeleteReportAsync(int id);
    }
}

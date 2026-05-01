using IMS.Domain.Features.Sales.Models;
using IMS.shared;
using IMS.Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IMS.Domain.Features.Sales
{
    public interface ISalesService
    {
        Task<PagedResult<ReportDTO>> GetReportsByBusinessIdAsync(PaginationRequest paginationRequest, int businessId);
        Task<Result<ReportDTO>> GetReportByIdAsync(int id);
        Task<Result<ReportDTO>> CreateReportAsync(CreateReportRequest request);
        Task<Result<bool>> DeleteReportAsync(int id);
    }
}

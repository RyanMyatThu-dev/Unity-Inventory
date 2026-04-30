using IMS.Domain.Features.Sales.Models;
using IMS.shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IMS.Domain.Features.Sales
{
    public interface ISalesService
    {
        Task<Result<List<ReportDTO>>> GetReportsByBusinessIdAsync(int businessId);
        Task<Result<ReportDTO>> GetReportByIdAsync(int id);
        Task<Result<ReportDTO>> CreateReportAsync(CreateReportRequest request);
        Task<Result<bool>> DeleteReportAsync(int id);
    }
}

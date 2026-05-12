using Unity_Inventory.Domain.Features.Dashboard.Models;
using Unity_Inventory.Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Unity_Inventory.Domain.Features.Dashboard
{
    public interface IDashboardService
    {
      
        Task<Result<DashboardData>> GetDashboardDataAsync(int businessId);

        
        Task<Result<RevenueDTO>> GetRevenueAsync(int businessId);

       
        Task<Result<CustomerStatsDTO>> GetCustomerStatsAsync(int businessId);

    
        Task<Result<ProductStatsDTO>> GetProductStatsAsync(int businessId, int topCount = 5);

      
        Task<Result<SalesTrendsDTO>> GetSalesTrendsAsync(int businessId);
    }
}

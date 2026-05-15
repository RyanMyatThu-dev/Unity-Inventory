using Unity_Inventory.Database.IMSDbContextModels;
using Unity_Inventory.Domain.Features.Dashboard.Models;
using Unity_Inventory.Shared;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Unity_Inventory.Domain.Features.Dashboard
{
    public class DashboardService : IDashboardService
    {
        private readonly IMSDbContext _db;
        public DashboardService(IMSDbContext db)
        {
            _db = db;
        }

        #region Get Dashboard Data
        public async Task<Result<DashboardData>> GetDashboardDataAsync(int businessId)
        {
            try
            {
                var revenue = await GetRevenueAsync(businessId);
                var customerStats = await  GetCustomerStatsAsync(businessId);
                var productStats = await GetProductStatsAsync(businessId);
                var salesTrends  = await GetSalesTrendsAsync(businessId);


                var dashboard = new DashboardData
                {
                    Revenue = revenue.Data!,
                    CustomerStats = customerStats.Data!,
                    ProductStats = productStats.Data!,
                    SalesTrends = salesTrends.Data!  
                };

                return Result<DashboardData>.Success(dashboard, "Dashboard data fetched successfully");

            }
            catch (Exception ex)
            {
                return Result<DashboardData>.Failure($"Error fetching dashboard data: {ex.Message}");
            }
        }
        #endregion

        #region Get Customer Stats
        public async Task<Result<CustomerStatsDTO>> GetCustomerStatsAsync(int businessId)
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                var startOfMonth = new DateTime(today.Year, today.Month, 1);
                var startOfYear = new DateTime(today.Year, 1, 1);

                // Fetch all three categories in parallel
                var topCustomerAllTime = await GetTopCustomersAsync(businessId, null, null, 5);
                var topCustomerThisMonth = await GetTopCustomersAsync(businessId, startOfMonth, today, 5);
                var topCustomerThisYear = await GetTopCustomersAsync(businessId, startOfYear, today, 5);    

                var dto = new CustomerStatsDTO
                {
                    TotalCustomers = await _db.TblCustomers
                        .CountAsync(c => c.BusinessId == businessId && c.DeleteFlag != true),

                    NewCustomersThisMonth = await _db.TblCustomers
                        .CountAsync(c => c.BusinessId == businessId
                                       && c.DeleteFlag != true
                                       && c.CreatedAt.HasValue
                                       && c.CreatedAt.Value >= startOfMonth),

                    TopCustomersAllTime = topCustomerAllTime,
                    TopCustomersThisMonth = topCustomerThisMonth,
                    TopCustomersThisYear = topCustomerThisYear
                };

                return Result<CustomerStatsDTO>.Success(dto);
            }
            catch (Exception ex)
            {
                return Result<CustomerStatsDTO>.Failure($"Error fetching customer stats: {ex.Message}");
            }
        }
        #endregion

        #region Get Product Stats
        public async Task<Result<ProductStatsDTO>> GetProductStatsAsync(int businessId, int topCount = 5)
        {
            try
            {
                var topProducts = await _db.TblVouchers
                    .AsNoTracking()
                    .Where(v => v.BusinessId == businessId)
                    .Include(v => v.Inventory)
                    .GroupBy(i => new
                    {
                        i.InventoryId,
                        i.Inventory.InventoryName,
                        i.Inventory.ImageId,
                        i.Inventory.ImageUrl,
                    })
                    .Select(g => new TopProductDTO
                    {
                        InventoryId = g.Key.InventoryId,
                        Name = g.Key.InventoryName,
                        ImageId = g.Key.ImageId ?? "",
                        ImageUrl = g.Key.ImageUrl ?? "",
                        TotalSold = g.Sum(x => x.Quantity),
                    })
                    .OrderByDescending(x => x.TotalSold)
                    .Take(topCount)
                    .ToListAsync();

                var totalProducts = await _db.TblInventories.CountAsync(i => i.BusinessId == businessId && i.DeleteFlag != true);

                return Result<ProductStatsDTO>.Success(new ProductStatsDTO
                {
                    TotalProducts = totalProducts,
                    TopSellingProducts = topProducts
                }, "Product stats calculated successfully");

            } catch (Exception ex)
            {
                return Result<ProductStatsDTO>.Failure($"Error calculating product stats: {ex.Message}");
            }
        }
        #endregion

        #region Revenue
        public async Task<Result<RevenueDTO>> GetRevenueAsync(int businessId)
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                var startOfMonth = new DateTime(today.Year, today.Month, 1);
                var startOfYear = new DateTime(today.Year, 1, 1);

                var reportData = await _db.TblReports
                    .AsNoTracking()
                    .Where(r => r.BusinessId == businessId && r.ReportDate.HasValue)
                    .Select(r => new
                    {
                        r.TotalAmount,
                        r.ReportDate
                    })
                    .ToListAsync();

                var dto = new RevenueDTO
                {
                    TotalRevenue = reportData.Sum(x => x.TotalAmount),
                    MonthlyRevenue = reportData
                        .Where(x => x.ReportDate!.Value >= startOfMonth)
                        .Sum(x => x.TotalAmount),
                    YearlyRevenue = reportData
                        .Where(x => x.ReportDate!.Value >= startOfYear)
                        .Sum(x => x.TotalAmount)
                };

                return Result<RevenueDTO>.Success(dto);
            }
            catch (Exception ex)
            {
                return Result<RevenueDTO>.Failure($"Error calculating revenue: {ex.Message}");
            }
        }
        #endregion

        #region Sales Trends
        public async Task<Result<SalesTrendsDTO>> GetSalesTrendsAsync(int businessId)
        {
            try
            {
                var saleTrends = new SalesTrendsDTO
                {
                    WeeklySales = await GetWeeklySalesAsync(businessId, 12),
                    MonthlySales = await GetMonthlySalesAsync(businessId, 12),
                    YearlySales = await GetYearlySalesAsync(businessId, 5)
                };

                return Result<SalesTrendsDTO>.Success(saleTrends, "Trends calculated successfully");

            } catch (Exception ex)
            {
                return Result<SalesTrendsDTO>.Failure($"Error calculating sales trends: {ex.Message}");
            }
        }
        #endregion

        #region Calculate Weekly, Monthly, Yearly Sales
        private async Task<List<WeeklySalesDTO>> GetWeeklySalesAsync(int businessId, int weeksBack)
        {
            try
            {
                var startDate = DateTime.UtcNow.AddDays(-7 * weeksBack);

                var rawData = await _db.TblReports
                    .AsNoTracking()
                    .Where(r => r.BusinessId == businessId && r.ReportDate >= startDate)
                    .Select(r => new { r.ReportDate, r.TotalAmount }) // Only pull what you need
                    .ToListAsync();

                 return rawData.GroupBy(r => new
                    {
                        r.ReportDate!.Value.Year,
                        week = CultureInfo.CurrentCulture.Calendar
                        .GetWeekOfYear(r.ReportDate!.Value, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday)
                    })
                    .Select(g => new WeeklySalesDTO
                    {
                        Year = g.Key.Year,
                        WeekNumber = g.Key.week,
                        Revenue = g.Sum(x => x.TotalAmount),
                        TotalOrders = g.Count(),
                        Label = $"Week {g.Key.week} ({g.Key.Year})"
                    })
                    .OrderBy(x => x.Year)
                    .ThenBy(x => x.WeekNumber)
                    .ToList();

            }
            catch (Exception ex)
            {
                throw new Exception($"Error calculating weekly sales: {ex.Message}");
            }
        }

        private async Task<List<MonthlySalesDTO>> GetMonthlySalesAsync(int businessId, int monthsBack)
        {
            try
            {
                var startDate = DateTime.UtcNow.AddMonths(-monthsBack);
                return await _db.TblReports
                    .AsNoTracking()
                    .Where(r => r.BusinessId == businessId && r.ReportDate >= startDate)
                    .GroupBy(r => new { r.ReportDate!.Value.Year, r.ReportDate.Value.Month })
                    .Select(g => new MonthlySalesDTO
                    {
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        Revenue = g.Sum(x => x.TotalAmount),
                        TotalOrders = g.Count(),
                        Label = $"{CultureInfo.CurrentCulture.DateTimeFormat.GetAbbreviatedMonthName(g.Key.Month)} {g.Key.Year}"
                    })
                    .OrderBy(x => x.Year)
                    .ThenBy(x => x.Month)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error calculating monthly sales: {ex.Message}");
            }
        }

        private async Task<List<YearlySalesDTO>> GetYearlySalesAsync(int businessId, int yearsBack)
        {
            try
            {
                var startDate = DateTime.UtcNow.AddYears(-yearsBack);
                return await _db.TblReports
                    .AsNoTracking()
                    .Where(r => r.BusinessId == businessId && r.ReportDate >= startDate)
                    .GroupBy(r => r.ReportDate!.Value.Year)
                    .Select(g => new YearlySalesDTO
                    {
                        Year = g.Key,
                        Revenue = g.Sum(x => x.TotalAmount),
                        TotalOrders = g.Count(),
                        Label = g.Key.ToString()
                    })
                    .OrderBy(x => x.Year)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error calculating yearly sales: {ex.Message}");
            }
        }
        #endregion

        #region Get Top Customers Montly, Yearly, All Time
        private async Task<List<TopCustomerDTO>> GetTopCustomersAsync(
    int businessId,
    DateTime? startDate = null,
    DateTime? endDate = null,
    int take = 5)
        {
            var query = _db.TblReports
                .AsNoTracking()
                .Where(r => r.BusinessId == businessId);

            if (startDate.HasValue)
                query = query.Where(r => r.ReportDate.HasValue && r.ReportDate.Value >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(r => r.ReportDate.HasValue && r.ReportDate.Value <= endDate.Value);

            return await query
                .GroupBy(r => new
                {
                    r.CustomerId,
                    r.Customer.CustomerName,
                    r.Customer.ImageUrl,
                    r.Customer.ImageId
                })
                .Select(g => new TopCustomerDTO
                {
                    CustomerId = g.Key.CustomerId,
                    CustomerName = g.Key.CustomerName ?? "Walk-in Customer",
                    ImageUrl = g.Key.ImageUrl ?? "",
                    ImageId = g.Key.ImageId ?? "",
                    TotalSpent = g.Sum(r => r.TotalAmount),
                    TotalOrders = g.Count()
                })
                .OrderByDescending(c => c.TotalSpent)
                .Take(take)
                .ToListAsync();
        }

        #endregion
    }
}

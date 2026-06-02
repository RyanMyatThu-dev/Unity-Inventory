using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Unity_Inventory.Database.IMSDbContextModels;
using Unity_Inventory.Domain.Features.Sales.Models;
using Unity_Inventory.Domain.Features.Summary.Models;
using Unity_Inventory.Shared;
using Microsoft.EntityFrameworkCore;

namespace Unity_Inventory.Domain.Features.Summary
{
    public class SummaryService : ISummaryService
    {
        private readonly IMSDbContext _db;

        public SummaryService(IMSDbContext db)
        {
            _db = db;
        }

        public async Task<Result<SalesSummaryDto>> GetSalesSummaryAsync(int businessId, string summaryType, DateOnly periodStartDate, DateOnly periodEndDate)
        {
            try
            {
                // First check if we have a pre-generated summary in the archive
                var archivedSummary = await _db.TblSummaryArchives
                    .FirstOrDefaultAsync(s => s.BusinessId == businessId
                                            && s.SummaryType == summaryType
                                            && s.PeriodStartDate == periodStartDate
                                            && s.PeriodEndDate == periodEndDate);

                if (archivedSummary != null)
                {
                    var summary = new SalesSummaryDto
                    {
                        SummaryId = archivedSummary.SummaryId,
                        BusinessId = archivedSummary.BusinessId,
                        SummaryType = archivedSummary.SummaryType,
                        PeriodStartDate = archivedSummary.PeriodStartDate,
                        PeriodEndDate = archivedSummary.PeriodEndDate,
                        TotalRevenue = archivedSummary.TotalRevenue,
                        AverageOrderValue = archivedSummary.AverageOrderValue,
                        TotalOrders = archivedSummary.TotalOrders,
                        TotalItemsSold = archivedSummary.TotalItemsSold,
                        UniqueCustomers = 0, // This would need to be calculated or stored separately
                        TopCustomerId = archivedSummary.TopCustomerId,
                        TopCustomerName = archivedSummary.TopCustomerName,
                        TopCustomerTotal = archivedSummary.TopCustomerTotal,
                        TopProductId = archivedSummary.TopInventoryId, // Assuming TopInventoryId maps to TopProductId
                        TopProductName = archivedSummary.TopInventoryName,
                        TopProductQuantitySold = archivedSummary.TopInventoryQuantitySold,
                        TopProductRevenue = 0, // This would need to be calculated or stored separately
                        GeneratedAt = archivedSummary.GeneratedAt,
                        Source = archivedSummary.Source ?? "Unknown"
                    };

                    await EnrichSummaryRankingsAsync(summary);
                    return Result<SalesSummaryDto>.Success(summary);
                }

                // If no archived summary, calculate on the fly
                return await CalculateSalesSummaryAsync(businessId, summaryType, periodStartDate, periodEndDate);
            }
            catch (Exception ex)
            {
                return Result<SalesSummaryDto>.Failure(ex.Message);
            }
        }

        public async Task<Result<SalesSummaryDto>> GenerateAndStoreSalesSummaryAsync(int businessId, string summaryType, DateOnly periodStartDate, DateOnly periodEndDate, string source = "API")
        {
            using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                // Calculate the summary
                var summaryResult = await CalculateSalesSummaryAsync(businessId, summaryType, periodStartDate, periodEndDate);
                if (!summaryResult.IsSuccess)
                {
                    await transaction.RollbackAsync();
                    return summaryResult;
                }

                var summary = summaryResult.Data;

                // Check if we already have a summary for this period/type
                var existingSummary = await _db.TblSummaryArchives
                    .FirstOrDefaultAsync(s => s.BusinessId == businessId
                                            && s.SummaryType == summaryType
                                            && s.PeriodStartDate == periodStartDate
                                            && s.PeriodEndDate == periodEndDate);

                if (existingSummary != null)
                {
                    // Update existing summary
                    existingSummary.TotalRevenue = summary.TotalRevenue;
                    existingSummary.AverageOrderValue = summary.AverageOrderValue;
                    existingSummary.TotalOrders = summary.TotalOrders;
                    existingSummary.TotalItemsSold = summary.TotalItemsSold;
                    // Note: UniqueCustomers not directly stored in TblSummaryArchive
                    existingSummary.TopCustomerId = summary.TopCustomerId;
                    existingSummary.TopCustomerName = summary.TopCustomerName;
                    existingSummary.TopCustomerTotal = summary.TopCustomerTotal;
                    existingSummary.TopInventoryId = summary.TopProductId;
                    existingSummary.TopInventoryName = summary.TopProductName;
                    existingSummary.TopInventoryQuantitySold = summary.TopProductQuantitySold;
                    // Note: TopProductRevenue not directly stored in TblSummaryArchive
                    existingSummary.GeneratedAt = DateTime.UtcNow;
                    existingSummary.Source = source;
                }
                else
                {
                    // Create new summary archive record
                    var summaryArchive = new TblSummaryArchive
                    {
                        BusinessId = businessId,
                        SummaryType = summaryType,
                        PeriodStartDate = periodStartDate,
                        PeriodEndDate = periodEndDate,
                        TotalRevenue = summary.TotalRevenue,
                        AverageOrderValue = summary.AverageOrderValue,
                        TotalOrders = summary.TotalOrders,
                        TotalItemsSold = summary.TotalItemsSold,
                        // UniqueCustomers not directly stored
                        TopCustomerId = summary.TopCustomerId,
                        TopCustomerName = summary.TopCustomerName,
                        TopCustomerTotal = summary.TopCustomerTotal,
                        TopInventoryId = summary.TopProductId,
                        TopInventoryName = summary.TopProductName,
                        TopInventoryQuantitySold = summary.TopProductQuantitySold,
                        // TopProductRevenue not directly stored
                        GeneratedAt = DateTime.UtcNow,
                        Source = source
                    };

                    _db.TblSummaryArchives.Add(summaryArchive);
                }

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                // Refresh the summary to get the SummaryId if it was newly created
                if (summary.SummaryId == 0)
                {
                    var archivedSummary = await _db.TblSummaryArchives
                        .FirstOrDefaultAsync(s => s.BusinessId == businessId
                                                && s.SummaryType == summaryType
                                                && s.PeriodStartDate == periodStartDate
                                                && s.PeriodEndDate == periodEndDate);

                    if (archivedSummary != null)
                    {
                        summary.SummaryId = archivedSummary.SummaryId;
                    }
                }

                return Result<SalesSummaryDto>.Success(summary);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return Result<SalesSummaryDto>.Failure(ex.Message);
            }
        }

        private async Task<Result<SalesSummaryDto>> CalculateSalesSummaryAsync(int businessId, string summaryType, DateOnly periodStartDate, DateOnly periodEndDate)
        {
            try
            {
                // Convert DateOnly to DateTime for querying
                var startDateTime = periodStartDate.ToDateTime(TimeOnly.MinValue);
                var endDateTime = periodEndDate.ToDateTime(TimeOnly.MaxValue);

                // Get reports within the period
                var reportsQuery = _db.TblReports
                    .Include(r => r.Customer)
                    .Where(r => r.BusinessId == businessId
                            && r.ReportDate >= startDateTime
                            && r.ReportDate <= endDateTime);

                var reports = await reportsQuery.ToListAsync();

                if (!reports.Any())
                {
                    // Return empty summary if no data
                    return Result<SalesSummaryDto>.Success(new SalesSummaryDto
                    {
                        BusinessId = businessId,
                        SummaryType = summaryType,
                        PeriodStartDate = periodStartDate,
                        PeriodEndDate = periodEndDate,
                        TotalRevenue = 0,
                        AverageOrderValue = 0,
                        TotalOrders = 0,
                        TotalItemsSold = 0,
                        UniqueCustomers = 0,
                        GeneratedAt = DateTime.UtcNow,
                        Source = "API"
                    });
                }

                // Get voucher details for these reports
                var reportIds = reports.Select(r => r.ReportId).ToList();
                var vouchers = await _db.TblVouchers
                    .Include(v => v.Inventory)
                    .Where(v => reportIds.Contains(v.ReportId) && v.BusinessId == businessId)
                    .ToListAsync();

                // Calculate metrics
                var totalRevenue = reports.Sum(r => r.TotalAmount);
                var totalOrders = reports.Count;
                var averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
                var totalItemsSold = vouchers.Sum(v => v.Quantity);
                var uniqueCustomers = reports.Select(r => r.CustomerId).Distinct().Count();

                var customerRanks = BuildCustomerRanks(reports, totalRevenue);
                var productRanks = BuildProductRanks(vouchers, totalRevenue);
                var topCustomer = customerRanks.FirstOrDefault();
                var topProductByQuantity = productRanks
                    .OrderByDescending(p => p.QuantitySold)
                    .ThenByDescending(p => p.Revenue)
                    .FirstOrDefault();

                var summary = new SalesSummaryDto
                {
                    BusinessId = businessId,
                    SummaryType = summaryType,
                    PeriodStartDate = periodStartDate,
                    PeriodEndDate = periodEndDate,
                    TotalRevenue = totalRevenue,
                    AverageOrderValue = averageOrderValue,
                    TotalOrders = totalOrders,
                    TotalItemsSold = totalItemsSold,
                    UniqueCustomers = uniqueCustomers,
                    TopCustomerId = topCustomer?.CustomerId,
                    TopCustomerName = topCustomer?.CustomerName,
                    TopCustomerTotal = topCustomer?.TotalRevenue,
                    TopProductId = topProductByQuantity?.ProductId,
                    TopProductName = topProductByQuantity?.ProductName,
                    TopProductQuantitySold = topProductByQuantity?.QuantitySold,
                    TopProductRevenue = topProductByQuantity?.Revenue,
                    CustomerRanks = customerRanks,
                    ProductRanks = productRanks,
                    GeneratedAt = DateTime.UtcNow,
                    Source = "API"
                };

                return Result<SalesSummaryDto>.Success(summary);
            }
            catch (Exception ex)
            {
                return Result<SalesSummaryDto>.Failure(ex.Message);
            }
        }

        private async Task EnrichSummaryRankingsAsync(SalesSummaryDto summary)
        {
            var startDateTime = summary.PeriodStartDate.ToDateTime(TimeOnly.MinValue);
            var endDateTime = summary.PeriodEndDate.ToDateTime(TimeOnly.MaxValue);

            var reports = await _db.TblReports
                .AsNoTracking()
                .Include(r => r.Customer)
                .Where(r => r.BusinessId == summary.BusinessId
                        && r.ReportDate >= startDateTime
                        && r.ReportDate <= endDateTime)
                .ToListAsync();

            if (!reports.Any())
            {
                summary.CustomerRanks = new();
                summary.ProductRanks = new();
                return;
            }

            var reportIds = reports.Select(r => r.ReportId).ToList();
            var vouchers = await _db.TblVouchers
                .AsNoTracking()
                .Include(v => v.Inventory)
                .Where(v => reportIds.Contains(v.ReportId) && v.BusinessId == summary.BusinessId)
                .ToListAsync();

            summary.UniqueCustomers = reports.Select(r => r.CustomerId).Distinct().Count();
            summary.CustomerRanks = BuildCustomerRanks(reports, summary.TotalRevenue);
            summary.ProductRanks = BuildProductRanks(vouchers, summary.TotalRevenue);

            var topCustomer = summary.CustomerRanks.FirstOrDefault();
            if (topCustomer != null)
            {
                summary.TopCustomerId = topCustomer.CustomerId;
                summary.TopCustomerName = topCustomer.CustomerName;
                summary.TopCustomerTotal = topCustomer.TotalRevenue;
            }

            var topProduct = summary.ProductRanks
                .OrderByDescending(p => p.QuantitySold)
                .ThenByDescending(p => p.Revenue)
                .FirstOrDefault();

            if (topProduct != null)
            {
                summary.TopProductId = topProduct.ProductId;
                summary.TopProductName = topProduct.ProductName;
                summary.TopProductQuantitySold = topProduct.QuantitySold;
                summary.TopProductRevenue = topProduct.Revenue;
            }
        }

        private static List<SalesSummaryCustomerRankDto> BuildCustomerRanks(List<TblReport> reports, decimal totalRevenue)
        {
            return reports
                .GroupBy(r => new
                {
                    r.CustomerId,
                    CustomerName = r.Customer?.CustomerName ?? "Walk-in Customer"
                })
                .Select(g => new
                {
                    g.Key.CustomerId,
                    g.Key.CustomerName,
                    TotalRevenue = g.Sum(r => r.TotalAmount),
                    TotalOrders = g.Count()
                })
                .OrderByDescending(c => c.TotalRevenue)
                .ThenBy(c => c.CustomerName)
                .Take(10)
                .Select((c, index) => new SalesSummaryCustomerRankDto
                {
                    Rank = index + 1,
                    CustomerId = c.CustomerId,
                    CustomerName = c.CustomerName,
                    TotalRevenue = c.TotalRevenue,
                    TotalOrders = c.TotalOrders,
                    PercentageOfRevenue = CalculatePercentage(c.TotalRevenue, totalRevenue)
                })
                .ToList();
        }

        private static List<SalesSummaryProductRankDto> BuildProductRanks(List<TblVoucher> vouchers, decimal totalRevenue)
        {
            return vouchers
                .GroupBy(v => new
                {
                    v.InventoryId,
                    ProductName = v.Inventory?.InventoryName ?? "Unknown Product"
                })
                .Select(g => new
                {
                    ProductId = g.Key.InventoryId,
                    g.Key.ProductName,
                    QuantitySold = g.Sum(v => v.Quantity),
                    Revenue = g.Sum(v => v.Quantity * v.SellPrice)
                })
                .OrderByDescending(p => p.Revenue)
                .ThenByDescending(p => p.QuantitySold)
                .Take(10)
                .Select((p, index) => new SalesSummaryProductRankDto
                {
                    Rank = index + 1,
                    ProductId = p.ProductId,
                    ProductName = p.ProductName,
                    QuantitySold = p.QuantitySold,
                    Revenue = p.Revenue,
                    PercentageOfRevenue = CalculatePercentage(p.Revenue, totalRevenue)
                })
                .ToList();
        }

        private static decimal CalculatePercentage(decimal value, decimal total)
        {
            return total <= 0 ? 0 : Math.Round(value / total * 100, 2);
        }

        public async Task<Result<List<SalesSummaryDto>>> GetSalesSummaryHistoryAsync(int businessId, string summaryType, int limit = 10)
        {
            try
            {
                var summaries = await _db.TblSummaryArchives
                    .Where(s => s.BusinessId == businessId && s.SummaryType == summaryType.ToUpper())
                    .OrderByDescending(s => s.PeriodStartDate)
                    .Take(limit)
                    .Select(s => new SalesSummaryDto
                    {
                        SummaryId = s.SummaryId,
                        BusinessId = s.BusinessId,
                        SummaryType = s.SummaryType,
                        PeriodStartDate = s.PeriodStartDate,
                        PeriodEndDate = s.PeriodEndDate,
                        TotalRevenue = s.TotalRevenue,
                        AverageOrderValue = s.AverageOrderValue,
                        TotalOrders = s.TotalOrders,
                        TotalItemsSold = s.TotalItemsSold,
                        UniqueCustomers = 0, // Calculated separately or left as 0 since not stored
                        TopCustomerId = s.TopCustomerId,
                        TopCustomerName = s.TopCustomerName,
                        TopCustomerTotal = s.TopCustomerTotal,
                        TopProductId = s.TopInventoryId,
                        TopProductName = s.TopInventoryName,
                        TopProductQuantitySold = s.TopInventoryQuantitySold,
                        TopProductRevenue = 0,
                        GeneratedAt = s.GeneratedAt,
                        Source = s.Source ?? "Unknown"
                    })
                    .ToListAsync();

                return Result<List<SalesSummaryDto>>.Success(summaries);
            }
            catch (Exception ex)
            {
                return Result<List<SalesSummaryDto>>.Failure(ex.Message);
            }
        }

        public async Task GenerateDailySummariesAsync()
        {
            var businesses = await _db.TblBusinesses.Select(b => b.BusinessId).ToListAsync();
            var yesterday = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));
            foreach (var businessId in businesses)
            {
                await GenerateAndStoreSalesSummaryAsync(businessId, "DAILY", yesterday, yesterday, "Hangfire");
            }
        }

        public async Task GenerateMonthlySummariesAsync()
        {
            var businesses = await _db.TblBusinesses.Select(b => b.BusinessId).ToListAsync();
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var lastMonth = today.AddMonths(-1);
            var startDate = new DateOnly(lastMonth.Year, lastMonth.Month, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);
            foreach (var businessId in businesses)
            {
                await GenerateAndStoreSalesSummaryAsync(businessId, "MONTHLY", startDate, endDate, "Hangfire");
            }
        }

        public async Task GenerateYearlySummariesAsync()
        {
            var businesses = await _db.TblBusinesses.Select(b => b.BusinessId).ToListAsync();
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var lastYear = today.Year - 1;
            var startDate = new DateOnly(lastYear, 1, 1);
            var endDate = new DateOnly(lastYear, 12, 31);
            foreach (var businessId in businesses)
            {
                await GenerateAndStoreSalesSummaryAsync(businessId, "YEARLY", startDate, endDate, "Hangfire");
            }
        }
    }
}

using Unity_Inventory.Database.IMSDbContextModels;
using Unity_Inventory.Domain.Features.Sales.Models;
using Unity_Inventory.Shared;
using Unity_Inventory.Shared;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Unity_Inventory.Domain.Features.Summary;
using Unity_Inventory.Domain.Hubs;
using Unity_Inventory.Domain.Features.Dashboard;

namespace Unity_Inventory.Domain.Features.Sales
{
    public class SalesService : ISalesService
    {
        private readonly IMSDbContext _db;
        private readonly IHubContext<SaleSummaryHub> _hub;
        private readonly IHubContext<DashboardHub> _dashboardHub;
        private readonly ISummaryService _summaryService;
        private readonly IDashboardService _dashboardService;

        public SalesService(IMSDbContext db, IHubContext<SaleSummaryHub> hub, IHubContext<DashboardHub> dashboardHub, ISummaryService summaryService, IDashboardService dashboardService)
        {
            _db = db;
            _hub = hub;
            _dashboardHub = dashboardHub;
            _summaryService = summaryService;
            _dashboardService = dashboardService;
        }

        public async Task<PagedResult<ReportDTO>> GetReportsByBusinessIdAsync(PaginationRequest paginationRequest, int businessId, DateTime? startDate = null, DateTime? endDate = null)
        {
            try
            {
                var query = _db.TblReports
                    .Include(r => r.Customer)
                    .Where(r => r.BusinessId == businessId);

                if (startDate.HasValue)
                    query = query.Where(r => r.ReportDate >= startDate.Value);

                if (endDate.HasValue)
                {
                    var endOfDay = endDate.Value.Date.AddDays(1).AddTicks(-1);
                    query = query.Where(r => r.ReportDate <= endOfDay);
                }

                var totalCount = await query.CountAsync();

                var items = await query
                    .OrderByDescending(r => r.ReportDate)
                    .Skip((paginationRequest.PageNumber - 1) * paginationRequest.PageSize)
                    .Take(paginationRequest.PageSize)
                    .Select(r => new
                    {
                        Id = r.ReportId,
                        BusinessId = r.BusinessId,
                        CustomerId = r.CustomerId,
                        CustomerName = r.Customer.CustomerName,
                        ReportDate = r.ReportDate,
                        TotalAmount = r.TotalAmount,
                        Remarks = r.Remarks
                    })
                    .ToListAsync();

                var dtos = items.Select(r => new ReportDTO
                {
                    Id = r.Id,
                    BusinessId = r.BusinessId,
                    CustomerId = r.CustomerId,
                    CustomerName = r.CustomerName,
                    ReportDate = r.ReportDate ?? DateTime.Now,
                    TotalAmount = r.TotalAmount,
                    Remarks = r.Remarks
                }).ToList();

                var pagination = new Pagination(paginationRequest.PageNumber, paginationRequest.PageSize, totalCount);
                return PagedResult<ReportDTO>.Success(dtos, pagination);
            }
            catch (Exception ex)
            {
                return PagedResult<ReportDTO>.Failure(ex.Message);
            }
        }

        public async Task<Result<ReportDTO>> GetReportByIdAsync(int id)
        {
            try
            {
                var report = await _db.TblReports
                    .Include(r => r.Customer)
                    .Include(r => r.TblVouchers)
                        .ThenInclude(v => v.Inventory)
                    .Where(r => r.ReportId == id)
                    .FirstOrDefaultAsync();

                if (report == null)
                    return Result<ReportDTO>.Failure("Sales report not found.");

                var dto = new ReportDTO
                {
                    Id = report.ReportId,
                    BusinessId = report.BusinessId,
                    CustomerId = report.CustomerId,
                    CustomerName = report.Customer.CustomerName,
                    ReportDate = report.ReportDate ?? DateTime.Now,
                    TotalAmount = report.TotalAmount,
                    Remarks = report.Remarks,
                    Vouchers = report.TblVouchers.Select(v => new VoucherDTO
                    {
                        Id = v.VoucherId,
                        InventoryId = v.InventoryId,
                        InventoryName = v.Inventory.InventoryName,
                        Quantity = v.Quantity,
                        SellPrice = v.SellPrice,
                        SubTotal = v.SubTotal
                    }).ToList()
                };

                return Result<ReportDTO>.Success(dto);
            }
            catch (Exception ex)
            {
                return Result<ReportDTO>.Failure(ex.Message);
            }
        }

        public async Task<Result<ReportDTO>> CreateReportAsync(CreateReportRequest request)
        {
            using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                var customer = await _db.TblCustomers.FindAsync(request.CustomerId);
                if (customer == null || customer.DeleteFlag == true)
                    return Result<ReportDTO>.Failure("Cannot create report for a non-existent or deleted customer.");

                var report = new TblReport
                {
                    BusinessId = request.BusinessId,
                    CustomerId = request.CustomerId,
                    ReportDate = request.ReportDate ?? DateTime.Now,
                    Remarks = request.Remarks,
                    TotalAmount = request.Vouchers.Sum(v => v.Quantity * v.SellPrice)
                };

                _db.TblReports.Add(report);
                await _db.SaveChangesAsync(); // Save to get ReportId

                foreach (var vReq in request.Vouchers)
                {
                    var voucher = new TblVoucher
                    {
                        BusinessId = request.BusinessId,
                        ReportId = report.ReportId,
                        InventoryId = vReq.InventoryId,
                        Quantity = vReq.Quantity,
                        SellPrice = vReq.SellPrice,
                        SubTotal = vReq.Quantity * vReq.SellPrice
                    };
                    _db.TblVouchers.Add(voucher);

                    // Update Inventory Summary
                    var invSummary = await _db.TblInventorySummaries
                        .FirstOrDefaultAsync(s => s.InventoryId == vReq.InventoryId && s.BusinessId == request.BusinessId);

                    if (vReq.Quantity < 0)
                    {
                        return Result<ReportDTO>.Failure("Invalid quantity. Cannot process negative quantity.");
                    }

                    var currentStock = invSummary?.CurrentStock ?? 0;
                    if (currentStock < vReq.Quantity)
                    {
                        return Result<ReportDTO>.Failure($"Insufficient stock for product. Available: {currentStock}, Required: {vReq.Quantity}.");
                    }

                    if (invSummary == null)
                    {
                        invSummary = new TblInventorySummary
                        {
                            BusinessId = request.BusinessId,
                            InventoryId = vReq.InventoryId,
                            CurrentStock = 0,
                            LastUpdated = DateTime.Now
                        };
                        _db.TblInventorySummaries.Add(invSummary);
                    }
                    else
                    {
                        invSummary.CurrentStock -= vReq.Quantity;
                        invSummary.LastUpdated = DateTime.Now;
                    }
                }

                // Update Customer Summary
                var custSummary = await _db.TblCustomerSummaries
                    .FirstOrDefaultAsync(s => s.CustomerId == request.CustomerId && s.BusinessId == request.BusinessId);

                if (custSummary == null)
                {
                    custSummary = new TblCustomerSummary
                    {
                        BusinessId = request.BusinessId,
                        CustomerId = request.CustomerId,
                        TotalPurchased = report.TotalAmount,
                        LastTransactionDate = DateTime.Now,
                        OutstandingBalance = 0 // Assuming cash payment for now
                    };
                    _db.TblCustomerSummaries.Add(custSummary);
                }
                else
                {
                    custSummary.TotalPurchased += report.TotalAmount;
                    custSummary.LastTransactionDate = DateTime.Now;
                }

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                try
                {
                    // Trigger real-time summary update for the business group packaged with Daily, Weekly, Monthly, and Yearly
                    var today = DateOnly.FromDateTime(DateTime.Now);
                    var firstDayOfMonth = new DateOnly(today.Year, today.Month, 1);
                    var lastDayOfMonth = firstDayOfMonth.AddMonths(1).AddDays(-1);
                    var firstDayOfYear = new DateOnly(today.Year, 1, 1);
                    var lastDayOfYear = new DateOnly(today.Year, 12, 31);
                    
                    var daysToSubtract = (int)today.DayOfWeek == 0 ? 6 : (int)today.DayOfWeek - 1;
                    var firstDayOfWeek = today.AddDays(-daysToSubtract);
                    var lastDayOfWeek = firstDayOfWeek.AddDays(6);

                    // Await sequentially to avoid EF Core DbContext concurrent usage errors
                    var dailyResult = await _summaryService.GetSalesSummaryAsync(request.BusinessId, "DAILY", today, today);
                    var weeklyResult = await _summaryService.GetSalesSummaryAsync(request.BusinessId, "WEEKLY", firstDayOfWeek, lastDayOfWeek);
                    var monthlyResult = await _summaryService.GetSalesSummaryAsync(request.BusinessId, "MONTHLY", firstDayOfMonth, lastDayOfMonth);
                    var yearlyResult = await _summaryService.GetSalesSummaryAsync(request.BusinessId, "YEARLY", firstDayOfYear, lastDayOfYear);

                    var packagedData = new
                    {
                        Daily = dailyResult.IsSuccess ? dailyResult.Data : null,
                        Weekly = weeklyResult.IsSuccess ? weeklyResult.Data : null,
                        Monthly = monthlyResult.IsSuccess ? monthlyResult.Data : null,
                        Yearly = yearlyResult.IsSuccess ? yearlyResult.Data : null
                    };

                    await _hub.Clients.Group($"Business_{request.BusinessId}").SendAsync("ReceiveSummaryUpdate", packagedData);
                    // Trigger real-time dashboard update
                    var dashboardResult = await _dashboardService.GetDashboardDataAsync(request.BusinessId);
                    if (dashboardResult.IsSuccess)
                    {
                        await _dashboardHub.Clients.Group($"Business_{request.BusinessId}").SendAsync("ReceiveDashboardUpdate", dashboardResult.Data);
                    }
                }
                catch (Exception ex)
                {
                    // Log error if needed, but don't fail the sale transaction
                    Console.WriteLine($"Failed to broadcast summary/dashboard update: {ex.Message}");
                }

                return await GetReportByIdAsync(report.ReportId);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return Result<ReportDTO>.Failure(ex.Message);
            }
        }

        public async Task<Result<bool>> DeleteReportAsync(int id)
        {
            using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                var report = await _db.TblReports.Include(r => r.TblVouchers).FirstOrDefaultAsync(r => r.ReportId == id);
                if (report == null)
                    return Result<bool>.Failure("Sales report not found.");

                _db.TblVouchers.RemoveRange(report.TblVouchers);
                _db.TblReports.Remove(report);

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                return Result<bool>.Success(true);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return Result<bool>.Failure(ex.Message);
            }
        }
    }
}

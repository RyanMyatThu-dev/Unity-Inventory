using IMS.Database.IMSDbContextModels;
using IMS.Domain.Features.Sales.Models;
using IMS.shared;
using IMS.Shared;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IMS.Domain.Features.Sales
{
    public class SalesService : ISalesService
    {
        private readonly IMSDbContext _db;

        public SalesService(IMSDbContext db)
        {
            _db = db;
        }

        public async Task<PagedResult<ReportDTO>> GetReportsByBusinessIdAsync(PaginationRequest paginationRequest, int businessId)
        {
            try
            {
                var query = _db.TblReports
                    .Include(r => r.Customer)
                    .Where(r => r.BusinessId == businessId);

                var totalCount = await query.CountAsync();

                var items = await query
                    .OrderByDescending(r => r.ReportDate)
                    .Skip((paginationRequest.PageNumber - 1) * paginationRequest.PageSize)
                    .Take(paginationRequest.PageSize)
                    .Select(r => new ReportDTO
                    {
                        Id = r.ReportId,
                        BusinessId = r.BusinessId,
                        CustomerId = r.CustomerId,
                        CustomerName = r.Customer.CustomerName,
                        ReportDate = r.ReportDate ?? DateTime.Now,
                        TotalAmount = r.TotalAmount ?? 0,
                        Remarks = r.Remarks
                    })
                    .ToListAsync();

                var pagination = new Pagination(paginationRequest.PageNumber, paginationRequest.PageSize, totalCount);
                return PagedResult<ReportDTO>.Success(items, pagination);
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
                    TotalAmount = report.TotalAmount ?? 0,
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
                    
                    if (invSummary == null)
                    {
                        invSummary = new TblInventorySummary
                        {
                            BusinessId = request.BusinessId,
                            InventoryId = vReq.InventoryId,
                            CurrentStock = -vReq.Quantity, // Assuming stock can go negative if not initialized
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

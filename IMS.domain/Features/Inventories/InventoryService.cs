using IMS.Database.IMSDbContextModels;
using IMS.Domain.Features.Inventories.Models;
using IMS.shared;
using IMS.Shared;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IMS.Domain.Features.Inventories
{
    public class InventoryService : IInventoryService
    {
        private readonly IMSDbContext _db;

        public InventoryService(IMSDbContext db)
        {
            _db = db;
        }

        public async Task<PagedResult<InventoriesDTO>> GetInventoriesByBusinessIdAsync(PaginationRequest paginationRequest, int businessId)
        {
            try
            {
                var query = _db.TblInventories
                    .Where(i => i.BusinessId == businessId && i.DeleteFlag != true);

                var totalCount = await query.CountAsync();

                var items = await query
                    .Skip((paginationRequest.PageNumber - 1) * paginationRequest.PageSize)
                    .Take(paginationRequest.PageSize)
                    .GroupJoin(
                        _db.TblInventorySummaries.Where(s => s.BusinessId == businessId),
                        inv => inv.InventoryId,
                        sum => sum.InventoryId,
                        (inv, sums) => new { inv, sums })
                    .SelectMany(
                        x => x.sums.DefaultIfEmpty(),
                        (x, summary) => new InventoriesDTO
                        {
                            Id = x.inv.InventoryId,
                            Name = x.inv.InventoryName,
                            BusinessId = x.inv.BusinessId,
                            Price = x.inv.Price,
                            DeleteFlag = x.inv.DeleteFlag ?? false,
                            CurrentStock = summary != null ? summary.CurrentStock : 0,
                            LastUpdated = summary != null ? summary.LastUpdated : null
                        })
                    .ToListAsync();

                var pagination = new Pagination(paginationRequest.PageNumber, paginationRequest.PageSize, totalCount);
                return PagedResult<InventoriesDTO>.Success(items, pagination);
            }
            catch (Exception ex)
            {
                return PagedResult<InventoriesDTO>.Failure(ex.Message);
            }
        }

        public async Task<Result<InventoriesDTO>> GetInventoryByIdAsync(int id)
        {
            try
            {
                var inventory = await _db.TblInventories
                    .Where(i => i.InventoryId == id && i.DeleteFlag != true)
                    .GroupJoin(
                        _db.TblInventorySummaries,
                        inv => inv.InventoryId,
                        sum => sum.InventoryId,
                        (inv, sums) => new { inv, sums })
                    .SelectMany(
                        x => x.sums.DefaultIfEmpty(),
                        (x, summary) => new InventoriesDTO
                        {
                            Id = x.inv.InventoryId,
                            Name = x.inv.InventoryName,
                            BusinessId = x.inv.BusinessId,
                            Price = x.inv.Price,
                            DeleteFlag = x.inv.DeleteFlag ?? false,
                            CurrentStock = summary != null ? summary.CurrentStock : 0,
                            LastUpdated = summary != null ? summary.LastUpdated : null
                        })
                    .FirstOrDefaultAsync();

                if (inventory == null)
                    return Result<InventoriesDTO>.Failure("Inventory item not found.");

                return Result<InventoriesDTO>.Success(inventory);
            }
            catch (Exception ex)
            {
                return Result<InventoriesDTO>.Failure(ex.Message);
            }
        }

        public async Task<Result<InventoriesDTO>> CreateInventoryAsync(CreateProductRequest request)
        {
            try
            {
                var inventory = new TblInventory
                {
                    BusinessId = request.BusinessId,
                    InventoryName = request.Name,
                    Price = request.Price,
                    DeleteFlag = false
                };

                _db.TblInventories.Add(inventory);
                await _db.SaveChangesAsync();

                return Result<InventoriesDTO>.Success(new InventoriesDTO
                {
                    Id = inventory.InventoryId,
                    Name = inventory.InventoryName,
                    BusinessId = inventory.BusinessId,
                    Price = inventory.Price,
                    DeleteFlag = false
                });
            }
            catch (Exception ex)
            {
                return Result<InventoriesDTO>.Failure(ex.Message);
            }
        }

        public async Task<Result<InventoriesDTO>> UpdateInventoryAsync(UpdateProductRequest request)
        {
            try
            {
                var inventory = await _db.TblInventories.FindAsync(request.Id);
                if (inventory == null)
                    return Result<InventoriesDTO>.Failure("Inventory item not found.");

                inventory.InventoryName = request.Name;
                inventory.Price = request.Price;

                await _db.SaveChangesAsync();

                return Result<InventoriesDTO>.Success(new InventoriesDTO
                {
                    Id = inventory.InventoryId,
                    Name = inventory.InventoryName,
                    BusinessId = inventory.BusinessId,
                    Price = inventory.Price,
                    DeleteFlag = inventory.DeleteFlag ?? false
                });
            }
            catch (Exception ex)
            {
                return Result<InventoriesDTO>.Failure(ex.Message);
            }
        }

        public async Task<Result<bool>> DeleteInventoryAsync(int id)
        {
            try
            {
                var inventory = await _db.TblInventories.FindAsync(id);
                if (inventory == null)
                    return Result<bool>.Failure("Inventory item not found.");

                inventory.DeleteFlag = true;
                await _db.SaveChangesAsync();

                return Result<bool>.Success(true);
            }
            catch (Exception ex)
            {
                return Result<bool>.Failure(ex.Message);
            }
        }

        public async Task<Result<bool>> UpdateStockAsync(UpdateStockRequest request)
        {
            try
            {
                var summary = await _db.TblInventorySummaries
                    .FirstOrDefaultAsync(s => s.InventoryId == request.InventoryId && s.BusinessId == request.BusinessId);

                if (summary == null)
                {
                    summary = new TblInventorySummary
                    {
                        InventoryId = request.InventoryId,
                        BusinessId = request.BusinessId,
                        CurrentStock = request.CurrentStock,
                        LastUpdated = DateTime.Now
                    };
                    _db.TblInventorySummaries.Add(summary);
                }
                else
                {
                    summary.CurrentStock = request.CurrentStock;
                    summary.LastUpdated = DateTime.Now;
                }

                await _db.SaveChangesAsync();
                return Result<bool>.Success(true);
            }
            catch (Exception ex)
            {
                return Result<bool>.Failure(ex.Message);
            }
        }
    }
}

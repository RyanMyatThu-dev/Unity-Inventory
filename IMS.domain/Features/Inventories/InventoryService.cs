using IMS.Database.IMSDbContextModels;
using IMS.Domain.Features.Inventories.Models;
using IMS.shared;
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

        public async Task<Result<List<InventoriesDTO>>> GetInventoriesByBusinessIdAsync(int businessId)
        {
            try
            {
                var inventories = await _db.TblInventories
                    .Where(i => i.BusinessId == businessId && i.DeleteFlag != true)
                    .Select(i => new InventoriesDTO
                    {
                        Id = i.InventoryId,
                        Name = i.InventoryName,
                        BusinessId = i.BusinessId,
                        Price = i.Price,
                        DeleteFlag = i.DeleteFlag ?? false
                    })
                    .ToListAsync();

                return Result<List<InventoriesDTO>>.Success(inventories);
            }
            catch (Exception ex)
            {
                return Result<List<InventoriesDTO>>.Failure(ex.Message);
            }
        }

        public async Task<Result<InventoriesDTO>> GetInventoryByIdAsync(int id)
        {
            try
            {
                var inventory = await _db.TblInventories
                    .Where(i => i.InventoryId == id && i.DeleteFlag != true)
                    .Select(i => new InventoriesDTO
                    {
                        Id = i.InventoryId,
                        Name = i.InventoryName,
                        BusinessId = i.BusinessId,
                        Price = i.Price,
                        DeleteFlag = i.DeleteFlag ?? false
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
    }
}

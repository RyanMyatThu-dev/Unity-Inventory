using Unity_Inventory.Database.IMSDbContextModels;
using Unity_Inventory.Domain.Features.CustomerPrices.Models;
using Unity_Inventory.Shared;
using Microsoft.EntityFrameworkCore;

namespace Unity_Inventory.Domain.Features.CustomerPrices
{
    public class CustomerPriceService : ICustomerPriceService
    {
        private readonly IMSDbContext _db;

        public CustomerPriceService(IMSDbContext db)
        {
            _db = db;
        }

        public async Task<Result<List<CustomerPriceDTO>>> GetPricesByCustomerAsync(int customerId, int businessId)
        {
            try
            {
                var prices = await _db.TblCustomerPrices
                    .Include(cp => cp.Customer)
                    .Include(cp => cp.Inventory)
                    .Where(cp => cp.CustomerId == customerId && cp.BusinessId == businessId)
                    .Select(cp => new CustomerPriceDTO
                    {
                        CustomerPriceId = cp.CustomerPriceId,
                        BusinessId = cp.BusinessId,
                        CustomerId = cp.CustomerId,
                        CustomerName = cp.Customer.CustomerName,
                        InventoryId = cp.InventoryId,
                        InventoryName = cp.Inventory.InventoryName,
                        DefaultPrice = cp.Inventory.Price,
                        SellPrice = cp.SellPrice
                    })
                    .ToListAsync();

                return Result<List<CustomerPriceDTO>>.Success(prices);
            }
            catch (Exception ex)
            {
                return Result<List<CustomerPriceDTO>>.Failure(ex.Message);
            }
        }

        public async Task<Result<List<CustomerPriceDTO>>> GetPricesByInventoryAsync(int inventoryId, int businessId)
        {
            try
            {
                var prices = await _db.TblCustomerPrices
                    .Include(cp => cp.Customer)
                    .Include(cp => cp.Inventory)
                    .Where(cp => cp.InventoryId == inventoryId && cp.BusinessId == businessId)
                    .Select(cp => new CustomerPriceDTO
                    {
                        CustomerPriceId = cp.CustomerPriceId,
                        BusinessId = cp.BusinessId,
                        CustomerId = cp.CustomerId,
                        CustomerName = cp.Customer.CustomerName,
                        InventoryId = cp.InventoryId,
                        InventoryName = cp.Inventory.InventoryName,
                        DefaultPrice = cp.Inventory.Price,
                        SellPrice = cp.SellPrice
                    })
                    .ToListAsync();

                return Result<List<CustomerPriceDTO>>.Success(prices);
            }
            catch (Exception ex)
            {
                return Result<List<CustomerPriceDTO>>.Failure(ex.Message);
            }
        }

        public async Task<Result<decimal>> GetEffectivePriceAsync(int customerId, int inventoryId, int businessId)
        {
            try
            {
                // Check for a custom price first
                var customPrice = await _db.TblCustomerPrices
                    .Where(cp => cp.CustomerId == customerId && cp.InventoryId == inventoryId && cp.BusinessId == businessId)
                    .Select(cp => (decimal?)cp.SellPrice)
                    .FirstOrDefaultAsync();

                if (customPrice.HasValue)
                    return Result<decimal>.Success(customPrice.Value, "Custom price applied");

                // Fall back to the default inventory price
                var defaultPrice = await _db.TblInventories
                    .Where(i => i.InventoryId == inventoryId)
                    .Select(i => (decimal?)i.Price)
                    .FirstOrDefaultAsync();

                if (!defaultPrice.HasValue)
                    return Result<decimal>.Failure("Inventory item not found.");

                return Result<decimal>.Success(defaultPrice.Value, "Default price applied");
            }
            catch (Exception ex)
            {
                return Result<decimal>.Failure(ex.Message);
            }
        }

        public async Task<Result<CustomerPriceDTO>> SetCustomerPriceAsync(SetCustomerPriceRequest request)
        {
            try
            {
                var existing = await _db.TblCustomerPrices
                    .FirstOrDefaultAsync(cp =>
                        cp.CustomerId == request.CustomerId &&
                        cp.InventoryId == request.InventoryId &&
                        cp.BusinessId == request.BusinessId);

                if (existing != null)
                {
                    // Update existing override
                    existing.SellPrice = request.SellPrice;
                }
                else
                {
                    // Create new override
                    existing = new TblCustomerPrice
                    {
                        BusinessId = request.BusinessId,
                        CustomerId = request.CustomerId,
                        InventoryId = request.InventoryId,
                        SellPrice = request.SellPrice
                    };
                    _db.TblCustomerPrices.Add(existing);
                }

                await _db.SaveChangesAsync();

                // Return with enriched names
                var dto = await _db.TblCustomerPrices
                    .Include(cp => cp.Customer)
                    .Include(cp => cp.Inventory)
                    .Where(cp => cp.CustomerPriceId == existing.CustomerPriceId)
                    .Select(cp => new CustomerPriceDTO
                    {
                        CustomerPriceId = cp.CustomerPriceId,
                        BusinessId = cp.BusinessId,
                        CustomerId = cp.CustomerId,
                        CustomerName = cp.Customer.CustomerName,
                        InventoryId = cp.InventoryId,
                        InventoryName = cp.Inventory.InventoryName,
                        DefaultPrice = cp.Inventory.Price,
                        SellPrice = cp.SellPrice
                    })
                    .FirstAsync();

                return Result<CustomerPriceDTO>.Success(dto);
            }
            catch (Exception ex)
            {
                return Result<CustomerPriceDTO>.Failure(ex.Message);
            }
        }

        public async Task<Result<bool>> DeleteCustomerPriceAsync(DeleteCustomerPriceRequest request)
        {
            try
            {
                var existing = await _db.TblCustomerPrices
                    .FirstOrDefaultAsync(cp =>
                        cp.CustomerId == request.CustomerId &&
                        cp.InventoryId == request.InventoryId &&
                        cp.BusinessId == request.BusinessId);

                if (existing == null)
                    return Result<bool>.Failure("Custom price override not found.");

                _db.TblCustomerPrices.Remove(existing);
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

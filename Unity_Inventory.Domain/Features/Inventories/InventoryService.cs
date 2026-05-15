using Unity_Inventory.Database.IMSDbContextModels;
using Unity_Inventory.Domain.Features.Inventories.Models;
using Unity_Inventory.Domain.Features.PhotoUpload;
using Unity_Inventory.Shared;
using Unity_Inventory.Shared;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Unity_Inventory.Domain.Features.Inventories
{
    public class InventoryService : IInventoryService
    {
        private readonly IMSDbContext _db;
        private readonly IPhotoUploadService _photoUploadService;


        public InventoryService(IMSDbContext db, IPhotoUploadService photoUploadService)
        {
            _db = db;
            _photoUploadService = photoUploadService;
        }

        public async Task<PagedResult<InventoriesDTO>> GetInventoriesByBusinessIdAsync(PaginationRequest paginationRequest, int businessId)
        {
            try
            {
                var query = _db.TblInventories
                    .Where(i => i.BusinessId == businessId && i.DeleteFlag != true);

                if (!string.IsNullOrWhiteSpace(paginationRequest.SearchTerm))
                {
                    var term = paginationRequest.SearchTerm.ToLower();
                    query = query.Where(i => i.InventoryName.ToLower().Contains(term));
                }

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
                            CurrentStock = summary != null ? summary.CurrentStock : 0,
                            LastUpdated = summary != null ? summary.LastUpdated : null,
                            VersionStamp = x.inv.VersionStamp,
                            StockVersionStamp = summary != null ? summary.VersionStamp : null,
                            ImageUrl = x.inv.ImageUrl,
                            ImageId = x.inv.ImageId,
                            CategoryId = x.inv.CategoryId,
                            CategoryName = x.inv.Category != null ? x.inv.Category.CategoryName : null
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
                            CurrentStock = summary != null ? summary.CurrentStock : 0,
                            LastUpdated = summary != null ? summary.LastUpdated : null,
                            VersionStamp = x.inv.VersionStamp,
                            StockVersionStamp = summary != null ? summary.VersionStamp : null,
                            ImageUrl = x.inv.ImageUrl,
                            ImageId = x.inv.ImageId,
                            CategoryId = x.inv.CategoryId,
                            CategoryName = x.inv.Category != null ? x.inv.Category.CategoryName : null
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
                if (request.CategoryId.HasValue)
                {
                    var categoryExists = await _db.TblCategories.AnyAsync(c => c.CategoryId == request.CategoryId && c.BusinessId == request.BusinessId);
                    if (!categoryExists) return Result<InventoriesDTO>.Failure("Invalid CategoryId for this business.");
                }

                var inventory = new TblInventory
                {
                    BusinessId = request.BusinessId,
                    InventoryName = request.Name,
                    Price = request.Price,
                    DeleteFlag = false,
                    CategoryId = request.CategoryId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _db.TblInventories.Add(inventory);

                if(request.InitialStock > 0)
                {
                    var summary = new TblInventorySummary
                    {
                        Inventory = inventory,
                        BusinessId = request.BusinessId,
                        CurrentStock = request.InitialStock,
                        LastUpdated = DateTime.Now
                    };
                    _db.TblInventorySummaries.Add(summary);
                }

                await _db.SaveChangesAsync();

                return Result<InventoriesDTO>.Success(new InventoriesDTO
                {
                    Id = inventory.InventoryId,
                    Name = inventory.InventoryName,
                    BusinessId = inventory.BusinessId,
                    Price = inventory.Price,
                    DeleteFlag = false,
                    VersionStamp = inventory.VersionStamp,
                    CategoryId = inventory.CategoryId
                });
            }
            catch (Exception ex)
            {
                return Result<InventoriesDTO>.Failure(ex.Message);
            }
        }

        public async Task<Result<InventoriesDTO>> UpdateInventoryAsync(UpdateProductRequest request, Stream photoStream, string fileName)
        {
            try
            {
                var inventory = await _db.TblInventories.FindAsync(request.Id);
                if (inventory == null || inventory.DeleteFlag == true)
                    return Result<InventoriesDTO>.Failure("Inventory item not found.");

                if (request.CategoryId.HasValue)
                {
                    var categoryExists = await _db.TblCategories.AnyAsync(c => c.CategoryId == request.CategoryId && c.BusinessId == inventory.BusinessId);
                    if (!categoryExists) return Result<InventoriesDTO>.Failure("Invalid CategoryId for this business.");
                }

                _db.Entry(inventory).Property(i => i.VersionStamp).OriginalValue = request.VersionStamp;

                inventory.InventoryName = request.Name;
                inventory.Price = request.Price;
                inventory.CategoryId = request.CategoryId;
                inventory.UpdatedAt = DateTime.UtcNow;

                string oldImageId = null;
                if (photoStream != null)
                {
                    var uploadResult = await _photoUploadService.UploadPhotoAsync(photoStream, fileName);
                    if (uploadResult == null || uploadResult.Error != null || uploadResult.SecureUrl == null)
                    {
                        var uploadError = uploadResult?.Error?.Message;
                        var message = string.IsNullOrWhiteSpace(uploadError)
                            ? "Photo upload failed."
                            : $"Photo upload failed: {uploadError}";
                        return Result<InventoriesDTO>.Failure(message);
                    }

                    oldImageId = inventory.ImageId;

                    inventory.ImageUrl = uploadResult.SecureUrl.ToString();
                    inventory.ImageId = uploadResult.PublicId;
                }

                await _db.SaveChangesAsync();

                if (photoStream != null && !string.IsNullOrEmpty(oldImageId))
                {
                    await _photoUploadService.DeletePhotoAsync(oldImageId);
                }

                return Result<InventoriesDTO>.Success(new InventoriesDTO
                {
                    Id = inventory.InventoryId,
                    Name = inventory.InventoryName,
                    BusinessId = inventory.BusinessId,
                    Price = inventory.Price,
                    VersionStamp = inventory.VersionStamp,
                    StockVersionStamp = request.StockVersionStamp,
                    ImageUrl = inventory.ImageUrl,
                    ImageId = inventory.ImageId,
                    CategoryId = inventory.CategoryId
                });
            }
            catch (DbUpdateConcurrencyException)
            {
                return Result<InventoriesDTO>.Failure("The inventory item has been modified by another user. Please refresh and try again.");
            }
            catch (Exception ex)
            {
                return Result<InventoriesDTO>.Failure(ex.Message);
            }
        }

        public async Task<Result<bool>> DeleteInventoryAsync(int id, byte[] version)
        {
            try
            {
                var inventory = await _db.TblInventories.FindAsync(id);
                if (inventory == null || inventory.DeleteFlag == true)
                    return Result<bool>.Failure("Inventory item not found.");

                _db.Entry(inventory).Property(i => i.VersionStamp).OriginalValue = version;

                inventory.DeleteFlag = true;
                await _db.SaveChangesAsync();

                return Result<bool>.Success(true);
            }
            catch (DbUpdateConcurrencyException)
            {
                return Result<bool>.Failure("The inventory item has been modified by another user. Please refresh and try again.");
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

                if (summary == null || request.StockVersionStamp == null)
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
                    _db.Entry(summary).Property(s => s.VersionStamp).OriginalValue = request.StockVersionStamp!;

                    summary.CurrentStock = request.CurrentStock;
                    summary.LastUpdated = DateTime.Now;
                }

                await _db.SaveChangesAsync();
                return Result<bool>.Success(true);
            }
            catch (DbUpdateConcurrencyException)
            {
                return Result<bool>.Failure("The stock level has changed since you last viewed it. Please refresh.");
            }
            catch (Exception ex)
            {
                return Result<bool>.Failure(ex.Message);
            }
        }

        public async Task<Result<InventoriesDTO>> CreateProductWithPhotoAsync(CreateProductRequest request, Stream photoStream, string fileName)
        {
            var existingProduct = await _db.TblInventories.FirstOrDefaultAsync
                (i => i.InventoryName == request.Name && i.BusinessId == request.BusinessId && i.DeleteFlag != true);

            if (existingProduct != null) return Result<InventoriesDTO>.Failure("Product with the same name already exists.");

            if (request.CategoryId.HasValue)
            {
                var categoryExists = await _db.TblCategories.AnyAsync(c => c.CategoryId == request.CategoryId && c.BusinessId == request.BusinessId);
                if (!categoryExists) return Result<InventoriesDTO>.Failure("Invalid CategoryId for this business.");
            }

            string photoUrl = null;
            string photoPublicId = null;
            if (photoStream != null)
            {
                var uploadFileName = string.IsNullOrWhiteSpace(fileName) ? request.Name : fileName;
                var uploadResult = await _photoUploadService.UploadPhotoAsync(photoStream, uploadFileName);

                if (uploadResult == null || uploadResult.Error != null || uploadResult.SecureUrl == null)
                {
                    var uploadError = uploadResult?.Error?.Message;
                    var message = string.IsNullOrWhiteSpace(uploadError)
                        ? "Photo upload failed."
                        : $"Photo upload failed: {uploadError}";
                    return Result<InventoriesDTO>.Failure(message);
                }

                photoUrl = uploadResult.SecureUrl.ToString();
                photoPublicId = uploadResult.PublicId;
            }
            try
            {

                var newProduct = new TblInventory
                {
                    BusinessId = request.BusinessId,
                    InventoryName = request.Name,
                    Price = request.Price,
                    DeleteFlag = false,
                    ImageUrl = photoUrl,
                    ImageId = photoPublicId,
                    CategoryId = request.CategoryId
                };

                _db.TblInventories.Add(newProduct);

                if(request.InitialStock > 0)
                {
                    var summary = new TblInventorySummary
                    {
                        Inventory = newProduct,
                        BusinessId = request.BusinessId,
                        CurrentStock = request.InitialStock,
                        LastUpdated = DateTime.Now
                    };
                    _db.TblInventorySummaries.Add(summary);
                }

                await _db.SaveChangesAsync();

                var data = new InventoriesDTO
                {
                    Id = newProduct.InventoryId,
                    Name = newProduct.InventoryName,
                    BusinessId = newProduct.BusinessId,
                    Price = newProduct.Price,
                    DeleteFlag = false,
                    VersionStamp = newProduct.VersionStamp,
                    ImageId = newProduct.ImageId,
                    ImageUrl = newProduct.ImageUrl,
                    CategoryId = newProduct.CategoryId
                };

                return Result<InventoriesDTO>.Success(data);

            } catch (Exception ex)
            {
                // if db save fail, rollback cloud upload
                if (!string.IsNullOrEmpty(photoPublicId))
                {
                    await _photoUploadService.DeletePhotoAsync(photoPublicId);
                }

                return Result<InventoriesDTO>.Failure(ex.Message);
            }
        }
    }
}

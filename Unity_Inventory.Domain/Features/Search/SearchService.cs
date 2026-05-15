using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Unity_Inventory.Database.IMSDbContextModels;
using Unity_Inventory.Domain.Features.Inventories.Models;
using Unity_Inventory.Domain.Features.Search.Models;
using Unity_Inventory.Shared;

namespace Unity_Inventory.Domain.Features.Search
{
    public class SearchService : ISearchService
    {
        private readonly IMSDbContext _db;
        public SearchService(IMSDbContext db)
        {
            _db = db;
        }



        public async Task<Result<List<CategoryDTO>>> SearchCategoryAsync(SearchCategoryRequestDTO request)
        {
            if (request == null)
                return Result<List<CategoryDTO>>.Failure("Search request cannot be null.");

            try
            {
                var query = _db.TblCategories
                    .AsNoTracking()
                    .Where(c => c.BusinessId == request.BusinessId && !c.DeleteFlag);

                if (!string.IsNullOrWhiteSpace(request.Name))
                    query = query.Where(c => c.CategoryName.ToLower().Contains(request.Name.ToLower()));

                query = request.IsDescending
                    ? query.OrderByDescending(c => c.CategoryName)
                    : query.OrderBy(c => c.CategoryName);
                var categories = await query
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .Select(c => new CategoryDTO
                    {
                        CategoryId = c.CategoryId,
                        CategoryName = c.CategoryName,
                        ParentCategoryId = c.ParentCategoryId,
                        Description = c.Description,
                        SubCategories = new List<CategoryDTO>()
                    })
                    .ToListAsync();

                return Result<List<CategoryDTO>>.Success(categories);
            }
            catch (Exception ex)
            {
                return Result<List<CategoryDTO>>.Failure(ex.Message);
            }
        }

        public async Task<PagedResult<InventoriesDTO>> SearchProductsAsync(SearchProductRequestDTO request)
        {
            if (request == null)
                return PagedResult<InventoriesDTO>.Failure("Search request cannot be null.");

            try
            {
                var query = _db.TblInventories
                    .AsNoTracking()
                    .Where(p => p.BusinessId == request.BusinessId && !p.DeleteFlag);

                // Filtering
                if (request.CategoryId.HasValue)
                {
                    var allCategories = await _db.TblCategories
                        .AsNoTracking()
                        .Where(c => c.BusinessId == request.BusinessId && !c.DeleteFlag)
                        .Select(c => new { c.CategoryId, c.ParentCategoryId })
                        .ToListAsync();

                    var categoryIdsToSearch = new HashSet<int> { request.CategoryId.Value };
                    var newFound = true;
                    while (newFound)
                    {
                        newFound = false;
                        var currentIds = categoryIdsToSearch.ToList();
                        foreach (var cat in allCategories)
                        {
                            if (cat.ParentCategoryId.HasValue && currentIds.Contains(cat.ParentCategoryId.Value) && categoryIdsToSearch.Add(cat.CategoryId))
                            {
                                newFound = true;
                            }
                        }
                    }

                    query = query.Where(p => p.CategoryId.HasValue && categoryIdsToSearch.Contains(p.CategoryId.Value));
                }

                if (request.MinPrice.HasValue)
                    query = query.Where(p => p.Price >= request.MinPrice.Value);

                if (request.MaxPrice.HasValue)
                    query = query.Where(p => p.Price <= request.MaxPrice.Value);

                if (request.StartDate.HasValue)
                    query = query.Where(p => p.CreatedAt >= request.StartDate.Value);

                if (request.EndDate.HasValue)
                    query = query.Where(p => p.CreatedAt <= request.EndDate.Value);

                if (!string.IsNullOrWhiteSpace(request.Name))
                    query = query.Where(p => p.InventoryName.ToLower().Contains(request.Name.ToLower()));

                // Joining with Summary for Stock filtering and CurrentStock data
                var combinedQuery = query.GroupJoin(
                    _db.TblInventorySummaries.Where(s => s.BusinessId == request.BusinessId),
                    inv => inv.InventoryId,
                    sum => sum.InventoryId,
                    (inv, sums) => new { inv, sums })
                .SelectMany(
                    x => x.sums.DefaultIfEmpty(),
                    (x, summary) => new { x.inv, summary });

                if (request.MinStockQuantity.HasValue)
                    combinedQuery = combinedQuery.Where(x => (x.summary != null ? x.summary.CurrentStock : 0) >= request.MinStockQuantity.Value);

                if (request.MaxStockQuantity.HasValue)
                    combinedQuery = combinedQuery.Where(x => (x.summary != null ? x.summary.CurrentStock : 0) <= request.MaxStockQuantity.Value);

                // Sorting
                combinedQuery = request.SortBy switch
                {
                    SearchProductRequestDTO.SortOptions.price => request.IsDescending 
                        ? combinedQuery.OrderByDescending(x => x.inv.Price) 
                        : combinedQuery.OrderBy(x => x.inv.Price),
                    SearchProductRequestDTO.SortOptions.createdDate => request.IsDescending 
                        ? combinedQuery.OrderByDescending(x => x.inv.CreatedAt) 
                        : combinedQuery.OrderBy(x => x.inv.CreatedAt),
                    _ => request.IsDescending 
                        ? combinedQuery.OrderByDescending(x => x.inv.InventoryName) 
                        : combinedQuery.OrderBy(x => x.inv.InventoryName)
                };

                var totalCount = await combinedQuery.CountAsync();

                var items = await combinedQuery
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .Select(x => new InventoriesDTO
                    {
                        Id = x.inv.InventoryId,
                        Name = x.inv.InventoryName,
                        BusinessId = x.inv.BusinessId,
                        Price = x.inv.Price,
                        DeleteFlag = x.inv.DeleteFlag,
                        CurrentStock = x.summary != null ? x.summary.CurrentStock : 0,
                        LastUpdated = x.summary != null ? x.summary.LastUpdated : null,
                        VersionStamp = x.inv.VersionStamp,
                        StockVersionStamp = x.summary != null ? x.summary.VersionStamp : null,
                        ImageUrl = x.inv.ImageUrl,
                        ImageId = x.inv.ImageId,
                        CategoryId = x.inv.CategoryId,
                        CategoryName = x.inv.Category != null ? x.inv.Category.CategoryName : null
                    })
                    .ToListAsync();

                var pagination = new Pagination(request.PageNumber, request.PageSize, totalCount);
                return PagedResult<InventoriesDTO>.Success(items, pagination);
            }
            catch (Exception ex)
            {
                return PagedResult<InventoriesDTO>.Failure(ex.Message);
            }
        }
    }
}   

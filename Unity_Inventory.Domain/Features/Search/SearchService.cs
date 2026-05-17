using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Unity_Inventory.Database.IMSDbContextModels;
using Unity_Inventory.Domain.Features.Customers.Models;
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

        public async Task<PagedResult<CustomerDTO>> SearchCustomersAsync(SearchCustomerRequestDTO request)
        {
            if (request == null)
                return PagedResult<CustomerDTO>.Failure("Search request cannot be null.");

            try
            {
                var query = _db.TblCustomers
                    .AsNoTracking()
                    .Include(c => c.TblCustomerSummaries)
                    .Where(c => c.BusinessId == request.BusinessId && !c.DeleteFlag);

                if (!string.IsNullOrWhiteSpace(request.Name))
                {
                    query = query.Where(c => c.CustomerName.ToLower().Contains(request.Name.ToLower()));
                } 

                var combinedQuery = query.GroupJoin(
                    _db.TblReports.Where(r => r.BusinessId == request.BusinessId)
                    ,
                    c => c.CustomerId,
                    r => r.CustomerId,
                    (customer, reports) => new { customer, reports })
                    .Select( x => new
                    {
                        x.customer,
                        sum = x.reports.Sum(r => (decimal?)r.TotalAmount) ?? 0,
                        totalOrders = x.reports.Count(),
                    });

                if(request.MinTotalSpent.HasValue)
                {
                    combinedQuery = combinedQuery.Where(x => x.sum >= request.MinTotalSpent.Value);
                }
                if(request.MaxTotalSpent.HasValue)
                {
                    combinedQuery = combinedQuery.Where(x => x.sum <= request.MaxTotalSpent.Value);
                }
                if(request.MinTotalOrders.HasValue)
                {
                    combinedQuery = combinedQuery.Where(x => x.totalOrders >= request.MinTotalOrders.Value);
                }
                if(request.MaxTotalOrders.HasValue)
                {
                    combinedQuery = combinedQuery.Where(x => x.totalOrders <= request.MaxTotalOrders.Value);
                }

                if(request.TransactionPeriodStart.HasValue)
                {
                    combinedQuery = combinedQuery.Where(x => x.customer.TblCustomerSummaries.Any(s => s.LastTransactionDate >= request.TransactionPeriodStart.Value));
                }
                if(request.TransactionPeriodEnd.HasValue)
                {
                    combinedQuery = combinedQuery.Where(x => x.customer.TblCustomerSummaries.Any(s => s.LastTransactionDate <= request.TransactionPeriodEnd.Value));
                }

                combinedQuery = request.SortBy switch { SearchCustomerRequestDTO.SortCustomerOptions.name => request.IsDescending 
                        ? combinedQuery.OrderByDescending(x => x.customer.CustomerName) 
                        : combinedQuery.OrderBy(x => x.customer.CustomerName),
                    SearchCustomerRequestDTO.SortCustomerOptions.totalOrders => request.IsDescending 
                        ? combinedQuery.OrderByDescending(x => x.totalOrders)    
                        : combinedQuery.OrderBy(x => x.totalOrders),
                    SearchCustomerRequestDTO.SortCustomerOptions.totalSpent => request.IsDescending 
                        ? combinedQuery.OrderByDescending(x => x.sum) 
                        : combinedQuery.OrderBy(x => x.sum),
                    SearchCustomerRequestDTO.SortCustomerOptions.lastTransactionDate => request.IsDescending 
                        ? combinedQuery.OrderByDescending(x => x.customer.TblCustomerSummaries.Max(s => s.LastTransactionDate)) 
                        : combinedQuery.OrderBy(x => x.customer.TblCustomerSummaries.Max(s => s.LastTransactionDate)),
                    _ => request.IsDescending 
                        ? combinedQuery.OrderByDescending(x => x.customer.CustomerName) 
                        : combinedQuery.OrderBy(x => x.customer.CustomerName)
                };
                var totalCount = await combinedQuery.CountAsync();

                var items = await combinedQuery
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .Select(x => new CustomerDTO
                    {
                        Id = x.customer.CustomerId,
                        Name = x.customer.CustomerName,
                        BusinessId = x.customer.BusinessId,
                        Phone = x.customer.Phone,
                        Address = x.customer.Address,
                        TotalSpent = (int)x.sum,
                        TotalOrders = x.totalOrders,
                        LastTransactionDate = x.customer.TblCustomerSummaries.Max(s => s.LastTransactionDate),
                        VersionStamp = x.customer.VersionStamp
                    })
                    .ToListAsync();

                var pagination = new Pagination(request.PageNumber, request.PageSize, totalCount);
                return PagedResult<CustomerDTO>.Success(items, pagination);

            }
            catch (Exception ex)
            {
                return PagedResult<CustomerDTO>.Failure(ex.Message);
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
                    .Include(p => p.Category)
                    .Where(p => p.BusinessId == request.BusinessId && !p.DeleteFlag);

                // Filtering
                if (request.CategoryId.HasValue)
                {
                    var includedCategoryIds = await GetAllSubCategoriesAsync(request.BusinessId, request.CategoryId.Value);

                    query = query.Where(p => p.CategoryId.HasValue && includedCategoryIds.Contains(p.CategoryId.Value));
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

        private async Task<HashSet<int>> GetAllSubCategoriesAsync(int businessId, int categoryId)
        {
            var allCategories = await _db.TblCategories
                .AsNoTracking()
                .Where(c => c.BusinessId == businessId && !c.DeleteFlag)
                .ToListAsync();

            bool addedNew = true;
            var results = new HashSet<int> { categoryId };
            while (addedNew)
            {
                addedNew = false;
                var currentResults = results.ToList();
                foreach (var category in allCategories)
                {
                    if(category.ParentCategoryId.HasValue &&
                        results.Contains(category.ParentCategoryId.Value) && results.Add(category.CategoryId))
                    {
                        addedNew = true;

                    }
                }
            }
            return results;
        }
    }
}   

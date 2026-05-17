using Microsoft.EntityFrameworkCore;
using Unity_Inventory.Database.IMSDbContextModels;
using Unity_Inventory.Domain.Features.Inventories.Models;
using Unity_Inventory.Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Unity_Inventory.Domain.Features.Inventories
{
    public class CategoryService : ICategoryService
    {
        private readonly IMSDbContext _db;

        public CategoryService(IMSDbContext db)
        {
            _db = db;
        }

        public async Task<Result<IEnumerable<CategoryDTO>>> GetCategoriesAsync(int businessId)
        {
            try
            {
                var categories = await _db.TblCategories
                    .Where(c => c.BusinessId == businessId && !c.DeleteFlag)
                    .Select(c => new CategoryDTO
                    {
                        CategoryId = c.CategoryId,
                        CategoryName = c.CategoryName,
                        Description = c.Description,
                        ParentCategoryId = c.ParentCategoryId

                    })
                    .ToListAsync();

                return Result<IEnumerable<CategoryDTO>>.Success(categories);
            }
            catch (Exception ex)
            {
                return Result<IEnumerable<CategoryDTO>>.Failure(ex.Message);
            }
        }

        public async Task<Result<IEnumerable<CategoryDTO>>> GetCategoryTreeAsync(int businessId)
        {
            try
            {
                var allCategories = await _db.TblCategories
                    .Where(c => c.BusinessId == businessId && !c.DeleteFlag)
                    .ToListAsync();

                var categoryDtos = allCategories.Select(c => new CategoryDTO
                {
                    CategoryId = c.CategoryId,
                    CategoryName = c.CategoryName,
                    Description = c.Description,
                    ParentCategoryId = c.ParentCategoryId
                }).ToList();

                var tree = BuildTree(categoryDtos, null);
                return Result<IEnumerable<CategoryDTO>>.Success(tree);
            }
            catch (Exception ex)
            {
                return Result<IEnumerable<CategoryDTO>>.Failure(ex.Message);
            }
        }

        private List<CategoryDTO> BuildTree(List<CategoryDTO> allNodes, int? parentId)
        {
            return allNodes
                .Where(n => n.ParentCategoryId == parentId)
                .Select(n => new CategoryDTO
                {
                    CategoryId = n.CategoryId,
                    CategoryName = n.CategoryName,
                    Description = n.Description,
                    ParentCategoryId = n.ParentCategoryId,
                    SubCategories = BuildTree(allNodes, n.CategoryId)
                })
                .ToList();
        }

        public async Task<Result<CategoryDTO>> GetCategoryByIdAsync(int id)
        {
            try
            {
                var c = await _db.TblCategories.FindAsync(id);
                if (c == null) return Result<CategoryDTO>.Failure("Category not found.");

                return Result<CategoryDTO>.Success(new CategoryDTO
                {
                    CategoryId = c.CategoryId,
                    CategoryName = c.CategoryName,
                    Description = c.Description,
                    ParentCategoryId = c.ParentCategoryId
                });
            }
            catch (Exception ex)
            {
                return Result<CategoryDTO>.Failure(ex.Message);
            }
        }

        public async Task<Result<CategoryDTO>> CreateCategoryAsync(CreateCategoryRequest request)
        {
            try
            {
                if (request.ParentCategoryId.HasValue)
                {
                    var parentExists = await _db.TblCategories.AnyAsync(c => c.CategoryId == request.ParentCategoryId && c.BusinessId == request.BusinessId);
                    if (!parentExists) return Result<CategoryDTO>.Failure("Invalid ParentCategoryId for this business.");
                }

                var category = new TblCategory
                {
                    BusinessId = request.BusinessId,
                    CategoryName = request.CategoryName,
                    Description = request.Description,
                    ParentCategoryId = request.ParentCategoryId,
                    CreatedAt = DateTime.UtcNow
                };

                _db.TblCategories.Add(category);
                await _db.SaveChangesAsync();

                return Result<CategoryDTO>.Success(new CategoryDTO
                {
                    CategoryId = category.CategoryId,
                    CategoryName = category.CategoryName,
                    Description = category.Description,
                    ParentCategoryId = category.ParentCategoryId
                });
            }
            catch (Exception ex)
            {
                return Result<CategoryDTO>.Failure(ex.Message);
            }
        }

        public async Task<Result<CategoryDTO>> UpdateCategoryAsync(UpdateCategoryRequest request)
        {
            try
            {
                var category = await _db.TblCategories.FindAsync(request.CategoryId);
                if (category == null) return Result<CategoryDTO>.Failure("Category not found.");

                if (request.ParentCategoryId.HasValue)
                {
                    if (request.ParentCategoryId == request.CategoryId) return Result<CategoryDTO>.Failure("A category cannot be its own parent.");

                    var parentExists = await _db.TblCategories.AnyAsync(c => c.CategoryId == request.ParentCategoryId && c.BusinessId == category.BusinessId);
                    if (!parentExists) return Result<CategoryDTO>.Failure("Invalid ParentCategoryId for this business.");
                }

                category.CategoryName = request.CategoryName;
                category.Description = request.Description;
                category.ParentCategoryId = request.ParentCategoryId;
                category.UpdatedAt = DateTime.UtcNow;

                await _db.SaveChangesAsync();

                return Result<CategoryDTO>.Success(new CategoryDTO
                {
                    CategoryId = category.CategoryId,
                    CategoryName = category.CategoryName,
                    Description = category.Description,
                    ParentCategoryId = category.ParentCategoryId
                });
            }
            catch (Exception ex)
            {
                return Result<CategoryDTO>.Failure(ex.Message);
            }
        }

        public async Task<Result<bool>> DeleteCategoryAsync(int id)
        {
            try
            {
                var category = await _db.TblCategories.FindAsync(id);
                if (category == null) return Result<bool>.Failure("Category not found.");

                // Check if it has inventories
                var hasInventories = await _db.TblInventories.AnyAsync(i => i.CategoryId == id && i.DeleteFlag != true);
                if (hasInventories) return Result<bool>.Failure("Cannot delete category with associated products.");

                // Check if it has subcategories
                var hasSubCategories = await _db.TblCategories.AnyAsync(c => c.ParentCategoryId == id && !c.DeleteFlag);
                if (hasSubCategories) return Result<bool>.Failure("Cannot delete category with subcategories.");

                category.DeleteFlag = true;
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

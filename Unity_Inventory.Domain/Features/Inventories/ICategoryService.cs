using Unity_Inventory.Domain.Features.Inventories.Models;
using Unity_Inventory.Shared;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Unity_Inventory.Domain.Features.Inventories
{
    public interface ICategoryService
    {
        Task<Result<IEnumerable<CategoryDTO>>> GetCategoriesAsync(int businessId);
        Task<Result<IEnumerable<CategoryDTO>>> GetCategoryTreeAsync(int businessId);
        Task<Result<CategoryDTO>> GetCategoryByIdAsync(int id);
        Task<Result<CategoryDTO>> CreateCategoryAsync(CreateCategoryRequest request);
        Task<Result<CategoryDTO>> UpdateCategoryAsync(UpdateCategoryRequest request);
        Task<Result<bool>> DeleteCategoryAsync(int id);
    }
}

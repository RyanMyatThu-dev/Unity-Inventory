using IMS.Domain.Features.Inventories.Models;
using IMS.shared;
using IMS.Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IMS.Domain.Features.Inventories
{
    public interface IInventoryService
    {
        Task<PagedResult<InventoriesDTO>> GetInventoriesByBusinessIdAsync(PaginationRequest paginationRequest, int businessId);
        Task<Result<InventoriesDTO>> GetInventoryByIdAsync(int id);
        Task<Result<InventoriesDTO>> CreateInventoryAsync(CreateProductRequest request);
        Task<Result<InventoriesDTO>> UpdateInventoryAsync(UpdateProductRequest request);
        Task<Result<bool>> DeleteInventoryAsync(int id);
        Task<Result<bool>> UpdateStockAsync(UpdateStockRequest request);
    }
}

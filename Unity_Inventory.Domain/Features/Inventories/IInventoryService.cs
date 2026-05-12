using Unity_Inventory.Domain.Features.Inventories.Models;
using Unity_Inventory.Shared;
using Unity_Inventory.Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Unity_Inventory.Domain.Features.Inventories
{
    public interface IInventoryService
    {
        Task<PagedResult<InventoriesDTO>> GetInventoriesByBusinessIdAsync(PaginationRequest paginationRequest, int businessId);
        Task<Result<InventoriesDTO>> GetInventoryByIdAsync(int id);
        Task<Result<InventoriesDTO>> CreateInventoryAsync(CreateProductRequest request);
        Task<Result<InventoriesDTO>> CreateProductWithPhotoAsync(CreateProductRequest request, Stream photoStream, string fileName);
        Task<Result<InventoriesDTO>> UpdateInventoryAsync(UpdateProductRequest request, Stream photoStream, string fileName);
        Task<Result<bool>> DeleteInventoryAsync(int id, byte[] version);
        Task<Result<bool>> UpdateStockAsync(UpdateStockRequest request);
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Unity_Inventory.Domain.Features.Customers.Models;
using Unity_Inventory.Domain.Features.Inventories.Models;
using Unity_Inventory.Domain.Features.Search.Models;
using Unity_Inventory.Shared;

namespace Unity_Inventory.Domain.Features.Search
{
    public interface ISearchService
    {
        Task<PagedResult<InventoriesDTO>> SearchProductsAsync(SearchProductRequestDTO request);

        Task<Result<List<CategoryDTO>>> SearchCategoryAsync(SearchCategoryRequestDTO request);

        Task<PagedResult<CustomerDTO>> SearchCustomersAsync(SearchCustomerRequestDTO request);
    }
}

using Unity_Inventory.Domain.Features.Customers.Models;
using Unity_Inventory.Shared;
using Unity_Inventory.Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Unity_Inventory.Domain.Features.Customers
{
    public interface ICustomerService
    {
        Task<PagedResult<CustomerDTO>> GetCustomersByBusinessIdAsync(PaginationRequest paginationRequest, int businessId);
        Task<Result<CustomerDTO>> GetCustomerByIdAsync(int id);
        Task<Result<CustomerDTO>> CreateCustomerAsync(CreateCustomerRequest request);
        Task<Result<CustomerDTO>> UpdateCustomerAsync(UpdateCustomerRequest request);
        Task<Result<bool>> DeleteCustomerAsync(int id, byte[] Version);
    }
}

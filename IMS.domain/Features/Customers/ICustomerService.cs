using IMS.Domain.Features.Customers.Models;
using IMS.shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IMS.Domain.Features.Customers
{
    public interface ICustomerService
    {
        Task<Result<List<CustomerDTO>>> GetCustomersByBusinessIdAsync(int businessId);
        Task<Result<CustomerDTO>> GetCustomerByIdAsync(int id);
        Task<Result<CustomerDTO>> CreateCustomerAsync(CreateCustomerRequest request);
        Task<Result<CustomerDTO>> UpdateCustomerAsync(UpdateCustomerRequest request);
        Task<Result<bool>> DeleteCustomerAsync(int id);
    }
}

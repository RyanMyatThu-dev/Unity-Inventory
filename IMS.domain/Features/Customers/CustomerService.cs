using IMS.Database.IMSDbContextModels;
using IMS.Domain.Features.Customers.Models;
using IMS.shared;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IMS.Domain.Features.Customers
{
    public class CustomerService : ICustomerService
    {
        private readonly IMSDbContext _db;

        public CustomerService(IMSDbContext db)
        {
            _db = db;
        }

        public async Task<Result<List<CustomerDTO>>> GetCustomersByBusinessIdAsync(int businessId)
        {
            try
            {
                var customers = await _db.TblCustomers
                    .Where(c => c.BusinessId == businessId)
                    .Select(c => new CustomerDTO
                    {
                        Id = c.CustomerId,
                        Name = c.CustomerName,
                        BusinessId = c.BusinessId,
                        Phone = c.Phone,
                        Address = c.Address,
                        TotalItems = c.TotalItems ?? 0
                    })
                    .ToListAsync();

                return Result<List<CustomerDTO>>.Success(customers);
            }
            catch (Exception ex)
            {
                return Result<List<CustomerDTO>>.Failure(ex.Message);
            }
        }

        public async Task<Result<CustomerDTO>> GetCustomerByIdAsync(int id)
        {
            try
            {
                var customer = await _db.TblCustomers
                    .Where(c => c.CustomerId == id)
                    .Select(c => new CustomerDTO
                    {
                        Id = c.CustomerId,
                        Name = c.CustomerName,
                        BusinessId = c.BusinessId,
                        Phone = c.Phone,
                        Address = c.Address,
                        TotalItems = c.TotalItems ?? 0
                    })
                    .FirstOrDefaultAsync();

                if (customer == null)
                    return Result<CustomerDTO>.Failure("Customer not found.");

                return Result<CustomerDTO>.Success(customer);
            }
            catch (Exception ex)
            {
                return Result<CustomerDTO>.Failure(ex.Message);
            }
        }

        public async Task<Result<CustomerDTO>> CreateCustomerAsync(CreateCustomerRequest request)
        {
            try
            {
                var customer = new TblCustomer
                {
                    BusinessId = request.BusinessId,
                    CustomerName = request.Name,
                    Phone = request.Phone,
                    Address = request.Address,
                    TotalItems = 0
                };

                _db.TblCustomers.Add(customer);
                await _db.SaveChangesAsync();

                return Result<CustomerDTO>.Success(new CustomerDTO
                {
                    Id = customer.CustomerId,
                    Name = customer.CustomerName,
                    BusinessId = customer.BusinessId,
                    Phone = customer.Phone,
                    Address = customer.Address,
                    TotalItems = 0
                });
            }
            catch (Exception ex)
            {
                return Result<CustomerDTO>.Failure(ex.Message);
            }
        }

        public async Task<Result<CustomerDTO>> UpdateCustomerAsync(UpdateCustomerRequest request)
        {
            try
            {
                var customer = await _db.TblCustomers.FindAsync(request.Id);
                if (customer == null)
                    return Result<CustomerDTO>.Failure("Customer not found.");

                customer.CustomerName = request.Name;
                customer.Phone = request.Phone;
                customer.Address = request.Address;

                await _db.SaveChangesAsync();

                return Result<CustomerDTO>.Success(new CustomerDTO
                {
                    Id = customer.CustomerId,
                    Name = customer.CustomerName,
                    BusinessId = customer.BusinessId,
                    Phone = customer.Phone,
                    Address = customer.Address,
                    TotalItems = customer.TotalItems ?? 0
                });
            }
            catch (Exception ex)
            {
                return Result<CustomerDTO>.Failure(ex.Message);
            }
        }

        public async Task<Result<bool>> DeleteCustomerAsync(int id)
        {
            try
            {
                var customer = await _db.TblCustomers.FindAsync(id);
                if (customer == null)
                    return Result<bool>.Failure("Customer not found.");

                // Check if customer has any reports/sales before deleting
                var hasReports = await _db.TblReports.AnyAsync(r => r.CustomerId == id);
                if (hasReports)
                    return Result<bool>.Failure("Cannot delete customer with existing sales reports.");

                _db.TblCustomers.Remove(customer);
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

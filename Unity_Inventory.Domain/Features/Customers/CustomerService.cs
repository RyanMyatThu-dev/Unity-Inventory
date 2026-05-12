using Unity_Inventory.Database.IMSDbContextModels;
using Unity_Inventory.Domain.Features.Customers.Models;
using Unity_Inventory.Shared;
using Unity_Inventory.Shared;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Unity_Inventory.Domain.Features.Customers
{
    public class CustomerService : ICustomerService
    {
        private readonly IMSDbContext _db;

        public CustomerService(IMSDbContext db)
        {
            _db = db;
        }

        public async Task<PagedResult<CustomerDTO>> GetCustomersByBusinessIdAsync(PaginationRequest paginationRequest, int businessId)
        {
            try
            {
                var query = _db.TblCustomers
                    .Where(c => c.BusinessId == businessId);

                var totalCount = await query.CountAsync();

                var items = await query
                    .Skip((paginationRequest.PageNumber - 1) * paginationRequest.PageSize)
                    .Take(paginationRequest.PageSize)
                    .GroupJoin(
                        _db.TblCustomerSummaries.Where(s => s.BusinessId == businessId),
                        c => c.CustomerId,
                        s => s.CustomerId,
                        (c, sums) => new { c, sums })
                    .SelectMany(
                        x => x.sums.DefaultIfEmpty(),
                        (x, summary) => new CustomerDTO
                        {
                            Id = x.c.CustomerId,
                            Name = x.c.CustomerName,
                            BusinessId = x.c.BusinessId,
                            Phone = x.c.Phone,
                            Address = x.c.Address,
                            TotalItems = x.c.TotalItems ?? 0,
                            TotalPurchased = summary != null ? summary.TotalPurchased : 0,
                            OutstandingBalance = summary != null ? summary.OutstandingBalance : 0,
                            LastTransactionDate = summary != null ? summary.LastTransactionDate : null,
                            VersionStamp = x.c.VersionStamp,
                        })
                    .ToListAsync();

                var pagination = new Pagination(paginationRequest.PageNumber, paginationRequest.PageSize, totalCount);
                return PagedResult<CustomerDTO>.Success(items, pagination);
            }
            catch (Exception ex)
            {
                return PagedResult<CustomerDTO>.Failure(ex.Message);
            }
        }

        public async Task<Result<CustomerDTO>> GetCustomerByIdAsync(int id)
        {
            try
            {
                var customer = await _db.TblCustomers
                    .Where(c => c.CustomerId == id)
                    .GroupJoin(
                        _db.TblCustomerSummaries,
                        c => c.CustomerId,
                        s => s.CustomerId,
                        (c, sums) => new { c, sums })
                    .SelectMany(
                        x => x.sums.DefaultIfEmpty(),
                        (x, summary) => new CustomerDTO
                        {
                            Id = x.c.CustomerId,
                            Name = x.c.CustomerName,
                            BusinessId = x.c.BusinessId,
                            Phone = x.c.Phone,
                            Address = x.c.Address,
                            TotalItems = x.c.TotalItems ?? 0,
                            TotalPurchased = summary != null ? summary.TotalPurchased : 0,
                            OutstandingBalance = summary != null ? summary.OutstandingBalance : 0,
                            LastTransactionDate = summary != null ? summary.LastTransactionDate : null,
                            VersionStamp = x.c.VersionStamp,
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
                    TotalItems = 0,
                    VersionStamp = customer.VersionStamp
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

                _db.Entry(customer).Property(p => p.VersionStamp).OriginalValue = request.VersionStamp;

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
                    TotalItems = customer.TotalItems ?? 0,
                    VersionStamp = customer.VersionStamp
                });
            }
            catch (DbUpdateConcurrencyException)
            {
                return Result<CustomerDTO>.Failure("The customer has been updated by another user. Please refresh and try again.");
            }
            catch (Exception ex)
            {
                return Result<CustomerDTO>.Failure(ex.Message);
            }
        }

        public async Task<Result<bool>> DeleteCustomerAsync(int id, byte[] version)
        {
            try
            {
                var customer = await _db.TblCustomers.FindAsync(id);
                if (customer == null)
                    return Result<bool>.Failure("Customer not found.");

                _db.Entry(customer).Property(p => p.VersionStamp).OriginalValue = version;

                // Check if customer has any reports/sales before deleting
                var hasReports = await _db.TblReports.AnyAsync(r => r.CustomerId == id);
                if (hasReports)
                    return Result<bool>.Failure("Cannot delete customer with existing sales reports.");

                _db.TblCustomers.Remove(customer);
                await _db.SaveChangesAsync();

                return Result<bool>.Success(true);
            }
            catch (DbUpdateConcurrencyException)
            {
                return Result<bool>.Failure("The customer has been updated by another user. Please refresh and try again.");
            }
            catch (Exception ex)
            {
                return Result<bool>.Failure(ex.Message);
            }
        }
    }
}

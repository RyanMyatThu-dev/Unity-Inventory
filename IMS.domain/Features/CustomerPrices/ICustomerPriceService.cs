using IMS.Domain.Features.CustomerPrices.Models;
using IMS.shared;

namespace IMS.Domain.Features.CustomerPrices
{
    public interface ICustomerPriceService
    {
        /// <summary>Get all custom prices set for a specific customer.</summary>
        Task<Result<List<CustomerPriceDTO>>> GetPricesByCustomerAsync(int customerId, int businessId);

        /// <summary>Get all custom prices for a specific product (all customers).</summary>
        Task<Result<List<CustomerPriceDTO>>> GetPricesByInventoryAsync(int inventoryId, int businessId);

        /// <summary>Get the effective price for a customer-product pair (custom price if set, else default).</summary>
        Task<Result<decimal>> GetEffectivePriceAsync(int customerId, int inventoryId, int businessId);

        /// <summary>Upsert a custom price for a customer-product pair.</summary>
        Task<Result<CustomerPriceDTO>> SetCustomerPriceAsync(SetCustomerPriceRequest request);

        /// <summary>Remove a custom price override, reverting to default.</summary>
        Task<Result<bool>> DeleteCustomerPriceAsync(DeleteCustomerPriceRequest request);
    }
}

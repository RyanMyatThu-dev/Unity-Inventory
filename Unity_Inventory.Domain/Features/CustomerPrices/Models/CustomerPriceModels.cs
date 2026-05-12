using System.ComponentModel.DataAnnotations;

namespace Unity_Inventory.Domain.Features.CustomerPrices.Models
{
    /// <summary>
    /// Represents a customer-specific price override for a product.
    /// </summary>
    public class CustomerPriceDTO
    {
        public int CustomerPriceId { get; set; }
        public int BusinessId { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int InventoryId { get; set; }
        public string InventoryName { get; set; } = string.Empty;
        public decimal DefaultPrice { get; set; }
        public decimal SellPrice { get; set; }
    }

    public class SetCustomerPriceRequest
    {
        [Required]
        public int BusinessId { get; set; }
        [Required]
        public int CustomerId { get; set; }
        [Required]
        public int InventoryId { get; set; }
        [Required]
        public decimal SellPrice { get; set; }
    }

    public class DeleteCustomerPriceRequest
    {
        [Required]
        public int CustomerId { get; set; }
        [Required]
        public int InventoryId { get; set; }
        [Required]
        public int BusinessId { get; set; }
    }
}

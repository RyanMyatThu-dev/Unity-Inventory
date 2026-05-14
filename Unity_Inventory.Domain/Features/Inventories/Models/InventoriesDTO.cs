using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Unity_Inventory.Domain.Features.Inventories.Models
{
    public class InventoriesDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int BusinessId { get; set; }
        public decimal Price { get; set; }
        public bool DeleteFlag { get; set; }
        public int? CurrentStock { get; set; }
        public DateTime? LastUpdated { get; set; }
        public byte[] VersionStamp { get; set; }
        public byte[]? StockVersionStamp { get; set; }

        public string? ImageUrl { get; set; }
        public string? ImageId { get; set; }
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }

    }
    public class CreateProductRequest
    {
        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;
        [Required]
        public decimal Price { get; set; }
        [Required]
        public int BusinessId { get; set; }
        public int? CategoryId { get; set; }
    }

    public class UpdateProductRequest
    {
        [Required]
        public int Id { get; set; }
        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;
        [Required]
        public decimal Price { get; set; }

        [Required]
        public byte[] VersionStamp { get; set; }
        [Required]
        public byte[]? StockVersionStamp { get; set; }
        public int? CategoryId { get; set; }

    }
    public class UpdateStockRequest
    {
        [Required]
        public int InventoryId { get; set; }
        [Required]
        public int BusinessId { get; set; }
        [Required]
        public int CurrentStock { get; set; }

        public byte[]? StockVersionStamp { get; set; }

    }
}

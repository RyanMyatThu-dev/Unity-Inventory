using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Unity_Inventory.Domain.Features.Customers.Models
{
    public class CustomerDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int BusinessId { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public int TotalItems { get; set; }
        public int TotalOrders { get; set; }
        public int TotalSpent { get; set; }
        // From TblCustomerSummary
        public decimal? TotalPurchased { get; set; }
        public decimal? OutstandingBalance { get; set; }
        public DateTime? LastTransactionDate { get; set; }
        public byte[] VersionStamp { get; set; }
    }

    public class CreateCustomerRequest
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public int BusinessId { get; set; }

        public string? Phone { get; set; }
        public string? Address { get; set; }
    }

    public class UpdateCustomerRequest
    {
        [Required]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        public string? Phone { get; set; }
        public string? Address { get; set; }

        [Required]
        public byte[] VersionStamp { get; set;  }
    }
}

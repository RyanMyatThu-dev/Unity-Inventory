using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Unity_Inventory.Domain.Features.Sales.Models
{
    public class ReportDTO
    {
        public int Id { get; set; }
        public int BusinessId { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public DateTime ReportDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string? Remarks { get; set; }
        public List<VoucherDTO> Vouchers { get; set; } = new List<VoucherDTO>();
    }

    public class VoucherDTO
    {
        public int Id { get; set; }
        public int InventoryId { get; set; }
        public string InventoryName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal SellPrice { get; set; }
        public decimal SubTotal { get; set; }
    }

    public class CreateReportRequest
    {
        [Required]
        public int BusinessId { get; set; }

        [Required]
        public int CustomerId { get; set; }

        public DateTime? ReportDate { get; set; }

        public string? Remarks { get; set; }

        [Required]
        [MinLength(1)]
        public List<CreateVoucherRequest> Vouchers { get; set; } = new List<CreateVoucherRequest>();
    }

    public class CreateVoucherRequest
    {
        [Required]
        public int InventoryId { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }

        [Required]
        public decimal SellPrice { get; set; }
    }
}

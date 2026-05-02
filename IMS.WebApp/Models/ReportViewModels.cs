using System;
using System.Collections.Generic;

namespace IMS.WebApp.Models
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
        public List<VoucherDTO> Vouchers { get; set; } = new();
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

    public class InventoryDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int? CurrentStock { get; set; }
        public DateTime? LastUpdated { get; set; }
        public bool DeleteFlag { get; set; }
    }

    public class ApiResponse<T>
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
    }

    public class ApiPagedResponse<T>
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<T>? Data { get; set; }
    }
}

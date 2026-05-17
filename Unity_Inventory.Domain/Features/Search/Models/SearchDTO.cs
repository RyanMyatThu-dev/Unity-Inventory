using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Unity_Inventory.Shared;

namespace Unity_Inventory.Domain.Features.Search.Models
{
    public class SearchDTO
    {
        public int Id { get; set; }
        public int BusinessId { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Type { get; set; }
        public decimal? Price { get; set; }
    }

    public class SearchProductRequestDTO : PaginationRequest
    {
        public int? CategoryId { get; set; }
        public int BusinessId { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? MinStockQuantity { get; set; }
        public int? MaxStockQuantity { get; set; }
        public string? Name { get; set; }

        public enum SortOptions
        {
            name,
            price,
            createdDate
        }
        public SortOptions SortBy { get; set; } = 0;
        public bool IsDescending { get; set; } = false;
    }

    public class SearchCategoryRequestDTO : PaginationRequest
    {
        public string? Name { get; set; }
        public int BusinessId { get; set; }
        public bool IsDescending { get; set; } = false;
    }

    public class SearchCustomerRequestDTO : PaginationRequest
    {
        public string? Name { get; set; }
        public int BusinessId { get; set; }
        public bool IsDescending { get; set; } = false;
        public int ? MinTotalOrders { get; set; }
        public int ? MaxTotalOrders { get; set; }
        public int ? MinTotalSpent { get; set; }
        public int? MaxTotalSpent { get; set; }
        public enum SortCustomerOptions
        {
            name,
            totalOrders,
            totalSpent,
            lastTransactionDate
        }
        public SortCustomerOptions SortBy { get; set; } = 0;
        public DateTime ? TransactionPeriodStart { get; set; }
        public DateTime ? TransactionPeriodEnd { get; set; }
    }
}

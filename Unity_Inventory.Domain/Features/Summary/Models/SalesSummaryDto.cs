using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Unity_Inventory.Domain.Features.Summary.Models
{
    public class SalesSummaryDto
    {
        public int SummaryId { get; set; }
        public int BusinessId { get; set; }
        public string SummaryType { get; set; } = null!; // DAILY, WEEKLY, MONTHLY, YEARLY
        public DateOnly PeriodStartDate { get; set; }
        public DateOnly PeriodEndDate { get; set; }

        // Revenue metrics
        public decimal TotalRevenue { get; set; }
        public decimal AverageOrderValue { get; set; }

        // Volume metrics
        public int TotalOrders { get; set; }
        public int TotalItemsSold { get; set; }
        public int UniqueCustomers { get; set; }

        // Customer insights
        public int? TopCustomerId { get; set; }
        public string? TopCustomerName { get; set; }
        public decimal? TopCustomerTotal { get; set; }

        // Product insights
        public int? TopProductId { get; set; }
        public string? TopProductName { get; set; }
        public int? TopProductQuantitySold { get; set; }
        public decimal? TopProductRevenue { get; set; }

        // Ranking insights for BI-style daily/period dashboards
        public List<SalesSummaryCustomerRankDto> CustomerRanks { get; set; } = new();
        public List<SalesSummaryProductRankDto> ProductRanks { get; set; } = new();
        public List<SalesTrendPointDto> SalesTrend { get; set; } = new();

        // Metadata
        public DateTime GeneratedAt { get; set; }
        public string Source { get; set; } = null!; // API, Hangfire, etc.
    }

    public class SalesSummaryCustomerRankDto
    {
        public int Rank { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public decimal TotalRevenue { get; set; }
        public int TotalOrders { get; set; }
        public decimal PercentageOfRevenue { get; set; }
    }

    public class SalesSummaryProductRankDto
    {
        public int Rank { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int QuantitySold { get; set; }
        public decimal Revenue { get; set; }
        public decimal PercentageOfRevenue { get; set; }
    }
}

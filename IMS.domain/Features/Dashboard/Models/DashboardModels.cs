using IMS.Domain.Features.Inventories.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IMS.Domain.Features.Dashboard.Models
{

    public class DashboardData
    {
        public RevenueDTO Revenue { get; set; } = new();
        public CustomerStatsDTO CustomerStats { get; set; } = new();
        public ProductStatsDTO ProductStats { get; set; } = new();
        public SalesTrendsDTO SalesTrends { get; set; } = new();
    }
    public class RevenueDTO
    {
        public decimal TotalRevenue { get; set; }
        public decimal MonthlyRevenue { get; set; }
        public decimal YearlyRevenue { get; set; } = 0;
    }

    public class CustomerStatsDTO
    {
        public int TotalCustomers { get; set; }
        public int NewCustomersThisMonth { get; set; }
        public List<TopCustomerDTO> TopCustomersAllTime { get; set; } = new();
        public List<TopCustomerDTO> TopCustomersThisMonth { get; set; } = new();
        public List<TopCustomerDTO> TopCustomersThisYear { get; set; } = new();
    }

    public class TopCustomerDTO
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string ImageId { get; set; } = string.Empty;
        public decimal TotalSpent { get; set; }
        public int TotalOrders { get; set; }
    }


    public class ProductStatsDTO 
    {
        public int TotalProducts { get; set; }
        public List<TopProductDTO> TopSellingProducts { get; set; } = new List<TopProductDTO>();
    }

    public class TopProductDTO
    {
        public int InventoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int TotalSold { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string ImageId { get; set; } = string.Empty;
    }

    public class SalesTrendsDTO
    {
        public List<WeeklySalesDTO> WeeklySales { get; set; } = new List<WeeklySalesDTO>();
        public List<MonthlySalesDTO> MonthlySales { get; set; } = new List<MonthlySalesDTO>();
        public List<YearlySalesDTO> YearlySales { get; set; } = new List<YearlySalesDTO>();
    }

    public class WeeklySalesDTO
    {
        public string Label { get; set; } = string.Empty;        // e.g., "2026-W19" or "May 4 - May 10"
        public int WeekNumber { get; set; }
        public int Year { get; set; }
        public decimal Revenue { get; set; }
        public int TotalOrders { get; set; }
    }

    public class MonthlySalesDTO
    {
        public string Label { get; set; } = string.Empty;        // e.g., "May 2026"
        public int Year { get; set; }
        public int Month { get; set; }
        public decimal Revenue { get; set; }
        public int TotalOrders { get; set; }
    }

    public class YearlySalesDTO
    {
        public int Year { get; set; }
        public string Label { get; set; } = string.Empty;        // e.g., "2026"
        public decimal Revenue { get; set; }
        public int TotalOrders { get; set; }
    }

}

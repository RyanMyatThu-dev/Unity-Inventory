using System;
using System.Collections.Generic;

namespace Unity_Inventory.Database.IMSDbContextModels;

public partial class TblSummaryArchive
{
    public int SummaryId { get; set; }

    public int BusinessId { get; set; }

    public string SummaryType { get; set; } = null!;

    public DateOnly PeriodStartDate { get; set; }

    public DateOnly PeriodEndDate { get; set; }

    public decimal TotalRevenue { get; set; }

    public int TotalOrders { get; set; }

    public int TotalItemsSold { get; set; }

    public decimal AverageOrderValue { get; set; }

    public int? TopCustomerId { get; set; }

    public string? TopCustomerName { get; set; }

    public decimal? TopCustomerTotal { get; set; }

    public int? TopInventoryId { get; set; }

    public string? TopInventoryName { get; set; }

    public int? TopInventoryQuantitySold { get; set; }

    public DateTime GeneratedAt { get; set; }

    public string? Source { get; set; }

    public virtual TblBusiness Business { get; set; } = null!;
}

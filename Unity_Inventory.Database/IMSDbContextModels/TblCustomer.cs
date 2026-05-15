using System;
using System.Collections.Generic;

namespace Unity_Inventory.Database.IMSDbContextModels;

public partial class TblCustomer
{
    public int CustomerId { get; set; }

    public int BusinessId { get; set; }

    public string CustomerName { get; set; } = null!;

    public string? Phone { get; set; }

    public string? Address { get; set; }

    public int? TotalItems { get; set; }

    public byte[] VersionStamp { get; set; } = null!;

    public string? ImageUrl { get; set; }

    public string? ImageId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool DeleteFlag { get; set; }

    public virtual TblBusiness Business { get; set; } = null!;

    public virtual ICollection<TblCustomerPrice> TblCustomerPrices { get; set; } = new List<TblCustomerPrice>();

    public virtual ICollection<TblCustomerSummary> TblCustomerSummaries { get; set; } = new List<TblCustomerSummary>();

    public virtual ICollection<TblReport> TblReports { get; set; } = new List<TblReport>();
}

using System;
using System.Collections.Generic;

namespace Unity_Inventory.Database.IMSDbContextModels;

public partial class TblBusiness
{
    public int BusinessId { get; set; }

    public string BusinessName { get; set; } = null!;

    public string? SubscriptionTier { get; set; }

    public int OwnerId { get; set; }

    public virtual ICollection<TblCustomerPrice> TblCustomerPrices { get; set; } = new List<TblCustomerPrice>();

    public virtual ICollection<TblCustomerSummary> TblCustomerSummaries { get; set; } = new List<TblCustomerSummary>();

    public virtual ICollection<TblCustomer> TblCustomers { get; set; } = new List<TblCustomer>();

    public virtual ICollection<TblInventory> TblInventories { get; set; } = new List<TblInventory>();

    public virtual ICollection<TblInventorySummary> TblInventorySummaries { get; set; } = new List<TblInventorySummary>();

    public virtual ICollection<TblReport> TblReports { get; set; } = new List<TblReport>();

    public virtual ICollection<TblRolePermission> TblRolePermissions { get; set; } = new List<TblRolePermission>();

    public virtual ICollection<TblUserBusiness> TblUserBusinesses { get; set; } = new List<TblUserBusiness>();

    public virtual ICollection<TblVoucher> TblVouchers { get; set; } = new List<TblVoucher>();
}

using System;
using System.Collections.Generic;

namespace Unity_Inventory.Database.IMSDbContextModels;

public partial class TblInventory
{
    public int InventoryId { get; set; }

    public int BusinessId { get; set; }

    public string InventoryName { get; set; } = null!;

    public decimal Price { get; set; }

    public bool? DeleteFlag { get; set; }

    public byte[] VersionStamp { get; set; } = null!;

    public string? ImageUrl { get; set; }

    public string? ImageId { get; set; }

    public int? CategoryId { get; set; }

    public virtual TblBusiness Business { get; set; } = null!;

    public virtual TblCategory? Category { get; set; }

    public virtual ICollection<TblCustomerPrice> TblCustomerPrices { get; set; } = new List<TblCustomerPrice>();

    public virtual ICollection<TblInventorySummary> TblInventorySummaries { get; set; } = new List<TblInventorySummary>();

    public virtual ICollection<TblVoucher> TblVouchers { get; set; } = new List<TblVoucher>();
}

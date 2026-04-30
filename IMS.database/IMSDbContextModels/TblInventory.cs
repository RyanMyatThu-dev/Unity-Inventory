using System;
using System.Collections.Generic;

namespace IMS.Database.IMSDbContextModels;

public partial class TblInventory
{
    public int InventoryId { get; set; }

    public int BusinessId { get; set; }

    public string InventoryName { get; set; } = null!;

    public decimal Price { get; set; }

    public bool? DeleteFlag { get; set; }

    public virtual TblBusiness Business { get; set; } = null!;

    public virtual ICollection<TblCustomerPrice> TblCustomerPrices { get; set; } = new List<TblCustomerPrice>();

    public virtual ICollection<TblInventorySummary> TblInventorySummaries { get; set; } = new List<TblInventorySummary>();

    public virtual ICollection<TblVoucher> TblVouchers { get; set; } = new List<TblVoucher>();
}

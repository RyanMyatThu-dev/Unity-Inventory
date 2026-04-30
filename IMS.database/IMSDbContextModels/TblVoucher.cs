using System;
using System.Collections.Generic;

namespace IMS.Database.IMSDbContextModels;

public partial class TblVoucher
{
    public int VoucherId { get; set; }

    public int BusinessId { get; set; }

    public int ReportId { get; set; }

    public int InventoryId { get; set; }

    public int Quantity { get; set; }

    public decimal SellPrice { get; set; }

    public decimal SubTotal { get; set; }

    public virtual TblBusiness Business { get; set; } = null!;

    public virtual TblInventory Inventory { get; set; } = null!;

    public virtual TblReport Report { get; set; } = null!;
}

using System;
using System.Collections.Generic;

namespace IMS.Database.IMSDbContextModels;

public partial class TblCustomerPrice
{
    public int CustomerPriceId { get; set; }

    public int BusinessId { get; set; }

    public int CustomerId { get; set; }

    public int InventoryId { get; set; }

    public decimal SellPrice { get; set; }

    public virtual TblBusiness Business { get; set; } = null!;

    public virtual TblCustomer Customer { get; set; } = null!;

    public virtual TblInventory Inventory { get; set; } = null!;
}

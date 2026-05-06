using System;
using System.Collections.Generic;

namespace IMS.Database.IMSDbContextModels;

public partial class TblInventorySummary
{
    public int SummaryId { get; set; }

    public int BusinessId { get; set; }

    public int InventoryId { get; set; }

    public int? CurrentStock { get; set; }

    public DateTime? LastUpdated { get; set; }

    public byte[] VersionStamp { get; set; } = null!;

    public virtual TblBusiness Business { get; set; } = null!;

    public virtual TblInventory Inventory { get; set; } = null!;
}

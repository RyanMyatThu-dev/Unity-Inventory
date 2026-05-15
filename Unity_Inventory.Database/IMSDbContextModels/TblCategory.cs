using System;
using System.Collections.Generic;

namespace Unity_Inventory.Database.IMSDbContextModels;

public partial class TblCategory
{
    public int CategoryId { get; set; }

    public int BusinessId { get; set; }

    public string CategoryName { get; set; } = null!;

    public string? Description { get; set; }

    public int? ParentCategoryId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool DeleteFlag { get; set; }

    public virtual TblBusiness Business { get; set; } = null!;

    public virtual ICollection<TblCategory> InverseParentCategory { get; set; } = new List<TblCategory>();

    public virtual TblCategory? ParentCategory { get; set; }

    public virtual ICollection<TblInventory> TblInventories { get; set; } = new List<TblInventory>();
}

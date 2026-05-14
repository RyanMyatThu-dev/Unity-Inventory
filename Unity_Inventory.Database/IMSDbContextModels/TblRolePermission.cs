using System;
using System.Collections.Generic;

namespace Unity_Inventory.Database.IMSDbContextModels;

public partial class TblRolePermission
{
    public long Id { get; set; }

    public int BusinessId { get; set; }

    public int? UserId { get; set; }

    public string? RoleName { get; set; }

    public string MenuCode { get; set; } = null!;

    public string ActionCode { get; set; } = null!;

    public bool IsAllowed { get; set; }

    public bool IsRevoked { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int GrantedByUserId { get; set; }

    public int? RevokedByUserId { get; set; }

    public DateTime? RevokedAt { get; set; }

    public virtual TblBusiness Business { get; set; } = null!;

    public virtual TblUser GrantedByUser { get; set; } = null!;

    public virtual TblUser? RevokedByUser { get; set; }

    public virtual TblUser? User { get; set; }
}

using System;
using System.Collections.Generic;

namespace Unity_Inventory.Database.IMSDbContextModels;

public partial class TblUser
{
    public int UserId { get; set; }

    public string? Username { get; set; }

    public string Name { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string? ImageId { get; set; }

    public string? ImageUrl { get; set; }

    public DateTime CreatedAt { get; set; }

    public bool DeleteFlag { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<TblRolePermission> TblRolePermissions { get; set; } = new List<TblRolePermission>();

    public virtual ICollection<TblUserBusiness> TblUserBusinesses { get; set; } = new List<TblUserBusiness>();

    public virtual ICollection<TblUserToken> TblUserTokens { get; set; } = new List<TblUserToken>();
}

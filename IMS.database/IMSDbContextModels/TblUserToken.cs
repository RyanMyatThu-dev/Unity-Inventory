using System;
using System.Collections.Generic;

namespace IMS.Database.IMSDbContextModels;

public partial class TblUserToken
{
    public int TokenId { get; set; }

    public int UserId { get; set; }

    public string RefreshToken { get; set; } = null!;

    public bool? IsRevoked { get; set; }

    public DateTime ExpiryDate { get; set; }

    public DateTime? CreatedAt { get; set; }

    public string TokenHash { get; set; } = null!;

    public virtual TblUser User { get; set; } = null!;
}

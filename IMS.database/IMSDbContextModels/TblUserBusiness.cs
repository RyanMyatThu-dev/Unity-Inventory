using System;
using System.Collections.Generic;

namespace IMS.Database.IMSDbContextModels;

public partial class TblUserBusiness
{
    public int UserId { get; set; }

    public int BusinessId { get; set; }

    public string? Role { get; set; }

    public virtual TblBusiness Business { get; set; } = null!;

    public virtual TblUser User { get; set; } = null!;
}

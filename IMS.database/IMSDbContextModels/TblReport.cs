using System;
using System.Collections.Generic;

namespace IMS.Database.IMSDbContextModels;

public partial class TblReport
{
    public int ReportId { get; set; }

    public int BusinessId { get; set; }

    public int CustomerId { get; set; }

    public DateTime? ReportDate { get; set; }

    public decimal TotalAmount { get; set; }

    public string? Remarks { get; set; }

    public virtual TblBusiness Business { get; set; } = null!;

    public virtual TblCustomer Customer { get; set; } = null!;

    public virtual ICollection<TblVoucher> TblVouchers { get; set; } = new List<TblVoucher>();
}

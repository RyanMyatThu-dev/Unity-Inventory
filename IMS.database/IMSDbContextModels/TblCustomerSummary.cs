using System;
using System.Collections.Generic;

namespace IMS.Database.IMSDbContextModels;

public partial class TblCustomerSummary
{
    public int SummaryId { get; set; }

    public int BusinessId { get; set; }

    public int CustomerId { get; set; }

    public decimal? TotalPurchased { get; set; }

    public decimal? OutstandingBalance { get; set; }

    public DateTime? LastTransactionDate { get; set; }

    public virtual TblBusiness Business { get; set; } = null!;

    public virtual TblCustomer Customer { get; set; } = null!;
}

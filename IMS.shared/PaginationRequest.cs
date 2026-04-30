using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IMS.Shared
{
    public class PaginationRequest
    {
        int PageSize { get; set; } = 10;
        int PageNumber { get; set; } = 1;
    }
}

using System;

namespace Unity_Inventory.Domain.Features.Summary.Models
{
    public class SalesTrendPointDto
    {
        public string Label { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int Orders { get; set; }
    }
}

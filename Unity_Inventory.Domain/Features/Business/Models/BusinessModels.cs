using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Unity_Inventory.Domain.Features.Business.Models
{
    public class BusinessAccessResponse
    {
        public int BusinessId { get; set; }
        public string BusinessName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty; 
        public string SubscriptionTier { get; set; } = string.Empty;
    }

    public class BusinessCreateRequest
    {
        [Required]
        [MaxLength(100)]
        public string BusinessName { get; set; } = string.Empty;

        public string SubscriptionTier { get; set; } = "Free";

        [Required]
        public int OwnerUserId { get; set; }
    }

    public class BusinessDetailDto
    {
        public int BusinessId { get; set; }
        public string BusinessName { get; set; } = string.Empty;
        public string SubscriptionTier { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        public int TotalUsers { get; set; }
    }

    public class BusinessUpdateRequest
    {
        [Required]
        public int BusinessId { get; set; }

        [Required]
        [MaxLength(100)]
        public string BusinessName { get; set; } = string.Empty;
    }

}

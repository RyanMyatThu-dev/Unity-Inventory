using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Unity_Inventory.Domain.Features.Authorization.Models
{
    public class CheckPermissionRequest
    {
        public int UserId { get; set; }
        public int BusinessId { get; set; }
        public string MenuCode { get; set; } = null!;
        public string ActionCode { get; set; } = null!;
        public string RoleName { get; set; } = null!;
    }

    public class RolePermissionDTO
    {
        public string MenuCode { get; set; } = null!;
        public string ActionCode { get; set; } = null!;
        public bool IsAllowed { get; set; }
        public bool IsRevoked { get; set; }
    }

    public class  GrantPermissionRequest
    {
        public int UserId { get; set; }
        public int BusinessId { get; set; }
        public string MenuCode { get; set; } = null!;
        public string ActionCode { get; set; } = null!;
        public string RoleName { get; set; }
        public int GrantedByUserId { get; set; }
    }

    public class RevokePermissionRequest 
    {
        public int UserId { get; set; }
        public int BusinessId { get; set; }
        public string MenuCode { get; set; } = null!;
        public string ActionCode { get; set; } = null!;
        public string RoleName { get; set; }
        public int RevokedByUserId { get; set; }
    }
}

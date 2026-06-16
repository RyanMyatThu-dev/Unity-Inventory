using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Unity_Inventory.Domain.Hubs
{
    [Authorize(Roles = "Owner,Admin")]
    public class DashboardHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            if (Context.User!.IsInRole("Admin"))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");
            }
            if(Context.User!.IsInRole("Owner"))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "Owners");
            }
            await base.OnConnectedAsync();
        }
    }
}

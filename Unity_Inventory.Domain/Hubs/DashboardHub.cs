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
            var businessId = Context.User?.FindFirst("BusinessId")?.Value;
            if (!string.IsNullOrEmpty(businessId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"Business_{businessId}");
            }

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

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var businessId = Context.User?.FindFirst("BusinessId")?.Value;
            if (!string.IsNullOrEmpty(businessId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Business_{businessId}");
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}

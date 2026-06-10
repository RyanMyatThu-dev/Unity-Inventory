using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Unity_Inventory.Domain.Hubs
{
    [Authorize]
    public class SummaryHub : Hub
    {
        public async Task JoinBusinessGroup(int businessId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"business-{businessId}");
        }

        public async Task LeaveBusinessGroup(int businessId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"business-{businessId}");
        }
    }
}
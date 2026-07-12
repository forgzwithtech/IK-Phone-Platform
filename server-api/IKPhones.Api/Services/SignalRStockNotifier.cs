using IKPhones.Application.Interfaces;
using IKPhones.Core.Enums;
using IKPhones.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace IKPhones.Api.Services;

public class SignalRStockNotifier : IStockNotifier
{
    private readonly IHubContext<InventoryHub> _hubContext;

    public SignalRStockNotifier(IHubContext<InventoryHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyStockUpdateAsync(Guid itemId, ItemStatus newStatus)
    {
        // Broadcasts a "StockChanged" event to ALL connected web and iPad clients
        await _hubContext.Clients.All.SendAsync("StockChanged", itemId, newStatus.ToString());
    }
}
using IKPhones.Application.Interfaces;
using IKPhones.Core.Enums;
using IKPhones.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace IKPhones.Infrastructure.Workers;

public class ReservationCleanupWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ReservationCleanupWorker> _logger;

    public ReservationCleanupWorker(IServiceProvider serviceProvider, ILogger<ReservationCleanupWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("15-Minute Reservation Cleanup Worker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            await CleanupExpiredReservationsAsync();
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }

    private async Task CleanupExpiredReservationsAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IKPhonesDbContext>();
        var notifier = scope.ServiceProvider.GetRequiredService<IStockNotifier>();

        var expirationThreshold = DateTime.UtcNow.AddMinutes(-15);

        // THE FIX: Query the new InventoryUnits table and include the relational data
        var expiredUnits = await dbContext.InventoryUnits
            .Include(u => u.Variant)
                .ThenInclude(v => v.DeviceFamily)
            .Where(u => u.Status == ItemStatus.Reserved && u.ReservedAtUtc <= expirationThreshold)
            .ToListAsync();

        if (expiredUnits.Any())
        {
            foreach (var unit in expiredUnits)
            {
                unit.Status = ItemStatus.Available;
                unit.ReservedAtUtc = null;
                unit.ReservedBySessionId = null;

                // THE FIX: Safely fetch the device name through the relationship chain
                string deviceName = unit.Variant?.DeviceFamily?.Name ?? "Unknown Device";
                string specs = unit.Variant != null ? $"{unit.Variant.StorageCapacity} ({unit.Variant.Color})" : string.Empty;

                _logger.LogInformation($"Reverted unit {unit.Id} ({deviceName} {specs}) back to Available.");

                await notifier.NotifyStockUpdateAsync(unit.Id, ItemStatus.Available);
            }

            await dbContext.SaveChangesAsync();
        }
    }
}
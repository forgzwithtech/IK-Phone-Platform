using IKPhones.Application.Interfaces;
using IKPhones.Core.Enums;
using IKPhones.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization; 
using System.Linq;

namespace IKPhones.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventoryController : ControllerBase
{
    private readonly IKPhonesDbContext _dbContext;
    private readonly IStockNotifier _stockNotifier;

    public InventoryController(IKPhonesDbContext dbContext, IStockNotifier stockNotifier)
    {
        _dbContext = dbContext;
        _stockNotifier = stockNotifier;
    }

    [HttpGet]
    public async Task<IActionResult> GetAvailableStock(
        [FromQuery] string? query,
        [FromQuery] string? brand,
        [FromQuery] string? category,
        [FromQuery] string? condition,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice)
    {
        // 1. Build the base query with eager loading
        var stockQuery = _dbContext.InventoryUnits
            .Include(u => u.Variant)
                .ThenInclude(v => v.DeviceFamily)
                    .ThenInclude(df => df.Brand)     
            .Include(u => u.Variant)
                .ThenInclude(v => v.DeviceFamily)
                    .ThenInclude(df => df.Category)  
            .Where(u => u.Status == ItemStatus.Available)
            .AsQueryable();

        // 2. Apply dynamic Faceted Search filters if the frontend provides them
        if (!string.IsNullOrWhiteSpace(query))
        {
            var lowerQuery = query.ToLower();
            stockQuery = stockQuery.Where(u => 
                u.Variant.DeviceFamily.Name.ToLower().Contains(lowerQuery) || 
                u.Variant.DeviceFamily.Brand.Name.ToLower().Contains(lowerQuery));
        }

        if (!string.IsNullOrWhiteSpace(brand))
            stockQuery = stockQuery.Where(u => u.Variant.DeviceFamily.Brand.Name.ToLower() == brand.ToLower());

        if (!string.IsNullOrWhiteSpace(category))
            stockQuery = stockQuery.Where(u => u.Variant.DeviceFamily.Category.Name.ToLower() == category.ToLower());

        if (!string.IsNullOrWhiteSpace(condition))
            stockQuery = stockQuery.Where(u => u.RetailState.ToString().ToLower() == condition.ToLower());

        if (minPrice.HasValue)
            stockQuery = stockQuery.Where(u => u.SellingPrice >= minPrice.Value);

        if (maxPrice.HasValue)
            stockQuery = stockQuery.Where(u => u.SellingPrice <= maxPrice.Value);

        // 3. Project and execute
        var stock = await stockQuery
            .Select(u => new 
            {
                Id = u.Id,
                Brand = u.Variant.DeviceFamily.Brand.Name,
                ModelName = u.Variant.DeviceFamily.Name,
                Storage = u.Variant.StorageCapacity,
                Color = u.Variant.Color,
                Price = u.SellingPrice,
                Condition = u.RetailState.ToString(),
                Category = u.Variant.DeviceFamily.Category.Name,
                ImageUrl = u.Variant.ImageUrl
            })
            .ToListAsync();
            
        return Ok(stock);
    }

    // ─── POS EXCLUSIVE: GET AVAILABLE & LOCKED STOCK ───
    [HttpGet("pos-stock")]
    public async Task<IActionResult> GetPosStock()
    {
        var stock = await _dbContext.InventoryUnits
            .Include(u => u.Variant).ThenInclude(v => v.DeviceFamily).ThenInclude(df => df.Brand)
            .Include(u => u.Variant).ThenInclude(v => v.DeviceFamily).ThenInclude(df => df.Category)
            .Where(u => u.Status == ItemStatus.Available || u.Status == ItemStatus.Reserved) 
            .Select(u => new 
            {
                Id = u.Id,
                Brand = u.Variant.DeviceFamily.Brand.Name,
                ModelName = u.Variant.DeviceFamily.Name,
                Storage = u.Variant.StorageCapacity,
                Color = u.Variant.Color,
                Price = u.SellingPrice,
                Condition = u.RetailState.ToString(),
                Status = u.Status.ToString(), 
                SerialNumber = u.SerialNumber,
                ReservedBySessionId = u.ReservedBySessionId // Exposes who locked it
            })
            .ToListAsync();
            
        return Ok(stock);
    }

    [HttpPost("{id}/lock")]
    public async Task<IActionResult> LockItemForStore(Guid id, [FromQuery] string staffId)
    {
        var unit = await _dbContext.InventoryUnits.FindAsync(id);
        if (unit == null) return NotFound("Device not found.");

        unit.Status = ItemStatus.Reserved;
        unit.ReservedAtUtc = DateTime.UtcNow;
        unit.ReservedBySessionId = string.IsNullOrWhiteSpace(staffId) ? "UNKNOWN_STAFF" : staffId; // Saves YOUR staff ID

        await _dbContext.SaveChangesAsync();
        try { if (_stockNotifier != null) await _stockNotifier.NotifyStockUpdateAsync(id, ItemStatus.Reserved); } catch { }
        return Ok(new { Status = "Locked" });
    }
    
    [HttpPost("{id}/release")]
    public async Task<IActionResult> ReleaseItem(Guid id, [FromQuery] string staffId)
    {
        var unit = await _dbContext.InventoryUnits.FindAsync(id);
        if (unit == null) return NotFound();

        // Safety override so you don't get stuck during testing
        unit.Status = ItemStatus.Available;
        unit.ReservedAtUtc = null;
        unit.ReservedBySessionId = null;

        await _dbContext.SaveChangesAsync();
        try { if (_stockNotifier != null) await _stockNotifier.NotifyStockUpdateAsync(id, ItemStatus.Available); } catch { }
        return Ok(new { Status = "Available" });
    }

    [HttpPost("{id}/sell")]
    public async Task<IActionResult> SellWalkIn(Guid id, [FromQuery] string staffId)
    {
        var unit = await _dbContext.InventoryUnits.FindAsync(id);
        if (unit == null) return NotFound("Device not found.");

        unit.Status = ItemStatus.Sold;
        unit.ReservedAtUtc = null;
        unit.ReservedBySessionId = null;

        await _dbContext.SaveChangesAsync();
        try { if (_stockNotifier != null) await _stockNotifier.NotifyStockUpdateAsync(id, ItemStatus.Sold); } catch { }
        return Ok(new { Message = "Transaction Complete." });
    }
}
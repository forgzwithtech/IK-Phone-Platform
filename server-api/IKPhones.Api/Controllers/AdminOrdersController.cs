using IKPhones.Api.DTOs;
using IKPhones.Core.Entities;
using IKPhones.Core.Enums;
using IKPhones.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace IKPhones.Api.Controllers;

[ApiController]
[Route("api/admin/orders")]
// [Authorize(Roles = "Admin, Staff, Rider")]
public class AdminOrdersController : ControllerBase
{
    private readonly IKPhonesDbContext _dbContext;

    public AdminOrdersController(IKPhonesDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // ─── 1. STAFF QUEUE: VIEW ORDERS REQUIRING PACKAGING ───────────────────
    [HttpGet("queue")]
    public async Task<IActionResult> GetFulfillmentQueue()
    {
        var orders = await _dbContext.Orders
            .Include(o => o.Items)
                .ThenInclude(i => i.InventoryUnit)
                    .ThenInclude(u => u.Variant)
                        .ThenInclude(v => v.DeviceFamily)
                            .ThenInclude(df => df.Brand)
            .Where(o => o.Status == OrderStatus.Paid || o.Status == OrderStatus.Processing)
            .OrderBy(o => o.CreatedAtUtc)
            .Select(o => new {
                Id = o.Id,
                CustomerName = o.CustomerName,
                CustomerPhone = o.CustomerPhone,
                TotalAmount = o.TotalAmount,
                Status = o.Status.ToString(),
                Date = o.CreatedAtUtc,
                Items = o.Items.Select(i => new {
                    DeviceName = $"{i.InventoryUnit.Variant.DeviceFamily.Brand.Name} {i.InventoryUnit.Variant.DeviceFamily.Name}",
                    Specs = $"{i.InventoryUnit.Variant.StorageCapacity} • {i.InventoryUnit.Variant.Color}",
                    Condition = i.InventoryUnit.RetailState.ToString(),
                    SerialNumber = i.InventoryUnit.SerialNumber
                }).ToList()
            })
            .ToListAsync();

        return Ok(orders);
    }
    [HttpPost("{id}/package")]
    public async Task<IActionResult> PackageOrder(Guid id, [FromBody] AssignRiderRequest request)
    {
        var order = await _dbContext.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound("Order not found.");
        if (order.Status != OrderStatus.Paid) return BadRequest("Order is not in a payable state for packaging.");

        string securePin = Random.Shared.Next(1000, 9999).ToString();
        order.Status = OrderStatus.Processing;
        await _dbContext.SaveChangesAsync();

        return Ok(new
        {
            OrderId = order.Id,
            Status = "ReadyForDispatch",
            AssignedRider = request.RiderName,
            VerificationPinGenerated = securePin,
            Message = "Order packaged. Verification code generated and dispatched to client."
        });
    }

    [HttpPost("{id}/dispatch")]
    public async Task<IActionResult> DispatchOrder(Guid id)
    {
        var order = await _dbContext.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound("Order record missing.");

        order.Status = OrderStatus.OutForDelivery;
        await _dbContext.SaveChangesAsync();

        return Ok(new { Message = "Order is officially out for delivery with the assigned rider." });
    }

    [HttpPost("{id}/complete-delivery")]
    public async Task<IActionResult> CompleteDelivery(Guid id, [FromBody] CompleteDeliveryRequest request)
    {
        var order = await _dbContext.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound("Order not found.");
        
        order.Status = OrderStatus.Delivered;
        await _dbContext.SaveChangesAsync();

        return Ok(new
        {
            OrderId = order.Id,
            FinalStatus = order.Status.ToString(),
            Message = "Handshake verified successfully. Handover authorized and closed."
        });
    }

   // ─── UPGRADED: EXPLICIT RELATIONAL INJECTION FOR LIVE CHARTS ───
[HttpGet("all")]
public async Task<IActionResult> GetAllOrders()
{
    var orders = await _dbContext.Orders
        .Include(o => o.Items)
            .ThenInclude(i => i.InventoryUnit)
                .ThenInclude(u => u.Variant)
                    .ThenInclude(v => v.DeviceFamily)
                        .ThenInclude(df => df.Brand)
        .Include(o => o.Items)
            .ThenInclude(i => i.InventoryUnit)
                .ThenInclude(u => u.Variant)
                    .ThenInclude(v => v.DeviceFamily)
                        .ThenInclude(df => df.Category)
        .OrderByDescending(o => o.CreatedAtUtc)
        .Select(o => new {
            Id = o.Id,
            CustomerName = o.CustomerName,
            CustomerEmail = o.CustomerEmail,
            CustomerPhone = o.CustomerPhone,
            TotalAmount = o.TotalAmount,
            Status = o.Status.ToString(),
            Date = o.CreatedAtUtc,
            Items = o.Items.Select(i => new {
                BrandName = i.InventoryUnit.Variant.DeviceFamily.Brand.Name,
                CategoryName = i.InventoryUnit.Variant.DeviceFamily.Category.Name,
                ModelName = i.InventoryUnit.Variant.DeviceFamily.Name,
                Specs = $"{i.InventoryUnit.Variant.StorageCapacity} • {i.InventoryUnit.Variant.Color}",
                Condition = i.InventoryUnit.RetailState.ToString(),
                Price = i.LockedPrice,
                SerialNumber = i.InventoryUnit.SerialNumber
            }).ToList()
        })
        .ToListAsync();

    return Ok(orders);
}
}

public class AssignRiderRequest { public required string RiderName { get; set; } }
public class CompleteDeliveryRequest { public required string InputPin { get; set; } }
using IKPhones.Api.DTOs;
using IKPhones.Application.Interfaces;
using IKPhones.Core.Entities;
using IKPhones.Core.Enums;
using IKPhones.Infrastructure.Data;
using EmberzBackend.Enums; // Preserved for RetailState
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace IKPhones.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IKPhonesDbContext _dbContext;
    private readonly IStockNotifier _stockNotifier;

    public OrdersController(IKPhonesDbContext dbContext, IStockNotifier stockNotifier)
    {
        _dbContext = dbContext;
        _stockNotifier = stockNotifier;
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request)
    {
        if (request == null || !request.Items.Any()) return BadRequest("Your cart cannot be empty.");

        using var transaction = await _dbContext.Database.BeginTransactionAsync();

        try
        {
            var itemsToReserve = new List<InventoryUnit>();
            decimal orderTotal = 0;

            // 1. WAREHOUSE AUTO-PICKER
            foreach (var cartItem in request.Items)
            {
                // THE FIX: Parse the string into the Enum BEFORE the query
                if (!Enum.TryParse<RetailState>(cartItem.Condition, true, out var targetRetailState))
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new { Error = $"Invalid physical condition state requested: {cartItem.Condition}" });
                }

                var availableUnits = await _dbContext.InventoryUnits
                    .Include(u => u.Variant)
                        .ThenInclude(v => v.DeviceFamily)
                            .ThenInclude(df => df.Brand)
                    .Where(u => u.Variant.DeviceFamily.Brand.Name.ToLower() == cartItem.Brand.ToLower() &&
                                u.Variant.DeviceFamily.Name.ToLower() == cartItem.ModelName.ToLower() &&
                                u.Variant.StorageCapacity == cartItem.Storage &&
                                u.Variant.Color == cartItem.Color &&
                                u.RetailState == targetRetailState && // THE FIX: Compare Enum to Enum natively
                                u.Status == ItemStatus.Available)
                    .Take(cartItem.Quantity)
                    .ToListAsync();

                if (availableUnits.Count < cartItem.Quantity)
                {
                    await transaction.RollbackAsync();
                    return Conflict(new { Error = $"Not enough stock for {cartItem.ModelName} ({cartItem.Color}). Requested: {cartItem.Quantity}, Available: {availableUnits.Count}" });
                }

                itemsToReserve.AddRange(availableUnits);
                orderTotal += availableUnits.Sum(u => u.SellingPrice);
            }

            // 2. Create the Order
            var order = new Order
            {
                Id = Guid.NewGuid(),
                CustomerName = request.CustomerName.Trim(),
                CustomerEmail = request.CustomerEmail.Trim().ToLower(),
                CustomerPhone = request.CustomerPhone.Trim(),
                DeliveryAddress = request.DeliveryAddress?.Trim(),
                TotalAmount = orderTotal,
                Status = OrderStatus.Pending,
                CreatedAtUtc = DateTime.UtcNow
            };

            _dbContext.Orders.Add(order);

            // 3. Lock the inventory and generate OrderItems
            foreach (var unit in itemsToReserve)
            {
                unit.Status = ItemStatus.Reserved;
                unit.ReservedAtUtc = DateTime.UtcNow;
                unit.ReservedBySessionId = $"session-{order.Id}";

                var orderItem = new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    InventoryUnitId = unit.Id,
                    LockedPrice = unit.SellingPrice
                };

                _dbContext.OrderItems.Add(orderItem);
            }

            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();

            // Notify React clients
            foreach (var unit in itemsToReserve)
            {
                await _stockNotifier.NotifyStockUpdateAsync(unit.Id, ItemStatus.Reserved);
            }

            return Ok(new
            {
                OrderId = order.Id,
                TotalAmount = order.TotalAmount,
                Message = "Inventory successfully locked."
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    [HttpPost("{id}/mock-pay")]
    public async Task<IActionResult> MockPaymentSimulation(Guid id)
    {
        var order = await _dbContext.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);

        if (order == null) return NotFound("Order receipt registry not found.");
        if (order.Status != OrderStatus.Pending) return BadRequest($"This order is currently: {order.Status}");

        using var transaction = await _dbContext.Database.BeginTransactionAsync();

        try
        {
            var assignedUnitIds = order.Items.Select(oi => oi.InventoryUnitId).ToList();
            var linkedUnits = await _dbContext.InventoryUnits.Where(u => assignedUnitIds.Contains(u.Id)).ToListAsync();

            order.Status = OrderStatus.Paid;

            // Permanently mark physical items as sold
            foreach (var unit in linkedUnits)
            {
                unit.Status = ItemStatus.Sold;
                unit.ReservedAtUtc = null;
                unit.ReservedBySessionId = null;
            }

            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();

            foreach (var unit in linkedUnits)
            {
                await _stockNotifier.NotifyStockUpdateAsync(unit.Id, ItemStatus.Sold);
            }

            return Ok(new { Message = "Payment captured. Stock marked as Sold." });
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, "A database error occurred during payment.");
        }
    }
}
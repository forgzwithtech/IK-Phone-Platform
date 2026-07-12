using IKPhones.Core.Enums;

namespace IKPhones.Core.Entities;

public class Order
{
    public Guid Id { get; set; }
    
    // Customer Details
    public required string CustomerName { get; set; }
    public required string CustomerEmail { get; set; }
    public required string CustomerPhone { get; set; }
    public string? DeliveryAddress { get; set; } // Nullable if picking up in Akure store
    
    // Financials & Status
    public decimal TotalAmount { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    // Navigation Property to the specific items bought
    public List<OrderItem> Items { get; set; } = new();
}
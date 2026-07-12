using IKPhones.Core.Enums;

namespace IKPhones.Core.Entities;

public class InventoryItem
{
    public Guid Id { get; set; }
    public required string ModelName { get; set; }
    public required string StorageCapacity { get; set; } // e.g., "256GB"
    public required string Color { get; set; }
    public decimal RetailPrice { get; set; }
    public ItemStatus Status { get; set; } = ItemStatus.Available;
    
    // Tracking properties for the 15-min reservation matrix
    public DateTime? ReservedAtUtc { get; set; }
    public string? ReservedBySessionId { get; set; }
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;
}
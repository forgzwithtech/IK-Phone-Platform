namespace IKPhones.Core.Entities;

public class OrderItem
{
    public Guid Id { get; set; }
    
    public Guid OrderId { get; set; }
    public Order? Order { get; set; }

    // Links to the exact physical phone in the warehouse
    public Guid InventoryUnitId { get; set; }
    public InventoryUnit? InventoryUnit { get; set; }

    // We store the locked price here because the InventoryUnit price might change tomorrow
    public decimal LockedPrice { get; set; }
}
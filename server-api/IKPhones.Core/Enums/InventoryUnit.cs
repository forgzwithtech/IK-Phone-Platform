using System;
using EmberzBackend.Enums;
using IKPhones.Core.Enums;

namespace IKPhones.Core.Entities;

public class InventoryUnit
{
    public Guid Id { get; set; }
    public Guid DeviceVariantId { get; set; }
    
    public string SerialNumber { get; set; } = string.Empty; 
    public decimal SellingPrice { get; set; }
    
    public RetailState RetailState { get; set; } 
    public ConditionGrade? ConditionGrade { get; set; } 
    public ItemStatus Status { get; set; } = ItemStatus.Available;

    // ─── ADD THESE FOR RESERVATION TRACKING ────────────────────────
    public DateTime? ReservedAtUtc { get; set; }
    public string? ReservedBySessionId { get; set; }

    // Navigation Property
    public DeviceVariant? Variant { get; set; }
}
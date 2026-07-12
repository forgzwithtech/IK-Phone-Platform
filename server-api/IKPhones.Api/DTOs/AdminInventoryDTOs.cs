using System;
using System.Collections.Generic;

namespace IKPhones.Api.DTOs;

public class AddVariantRequest
{
    public Guid DeviceFamilyId { get; set; }
    public required string StorageCapacity { get; set; }
    public required string Color { get; set; }
    public required string ImageUrl { get; set; } // Supplied by the upload endpoint
}

public class AddStockRequest
{
    public Guid DeviceVariantId { get; set; }
    public decimal SellingPrice { get; set; }
    
    // Using strings here so the controller can safely parse them into your Enums
    public required string RetailState { get; set; } 
    public string? ConditionGrade { get; set; } 
    
    // Bulk array so you can scan 10 phones at once into the warehouse
    public required List<string> SerialNumbers { get; set; }
}
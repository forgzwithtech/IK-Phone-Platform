using System;
using System.Collections.Generic;

namespace IKPhones.Core.Entities;

public class Category
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty; // Useful for frontend URLs (e.g., "refurbished-fans")
    
    // Navigation property for Clean Architecture relational mapping
    public ICollection<DeviceFamily> DeviceFamilies { get; set; } = new List<DeviceFamily>();

}
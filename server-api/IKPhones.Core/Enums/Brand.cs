using System;
using System.Collections.Generic;
using EmberzBackend.Enums;
using IKPhones.Core.Enums;

namespace IKPhones.Core.Entities
{
    // 1. The Manufacturer (e.g., Apple, Samsung)
    public class Brand
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        
        // Navigation Property
        public ICollection<DeviceFamily> DeviceFamilies { get; set; } = new List<DeviceFamily>();
    }

    // 2. The Product Line (e.g., iPhone 15 Pro, Galaxy S24 Ultra)
    public class DeviceFamily
    {
        public Guid Id { get; set; }
        public Guid BrandId { get; set; }
        public string Name { get; set; } = string.Empty;
        // Inside IKPhones.Core.Entities.DeviceFamily.cs
public Guid CategoryId { get; set; }
public Category? Category { get; set; }
        
        // Navigation Properties
        public Brand? Brand { get; set; }
        public ICollection<DeviceVariant> Variants { get; set; } = new List<DeviceVariant>();
    }

    // 3. The Specific Configuration (e.g., 256GB, Natural Titanium)
    public class DeviceVariant
    {
        public Guid Id { get; set; }
        public Guid DeviceFamilyId { get; set; }
        public string StorageCapacity { get; set; } = string.Empty; 
        public string Color { get; set; } = string.Empty; 
        public string ImageUrl { get; set; } = string.Empty;
        
        public DeviceFamily? DeviceFamily { get; set; }
        public ICollection<InventoryUnit> InventoryUnits { get; set; } = new List<InventoryUnit>();
    }

}
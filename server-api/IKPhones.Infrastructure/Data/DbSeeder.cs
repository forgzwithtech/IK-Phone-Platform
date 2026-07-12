using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using IKPhones.Core.Entities;
using IKPhones.Core.Enums;
using EmberzBackend.Enums;

namespace IKPhones.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IKPhonesDbContext context)
    {
        // 1. Prevent duplicate seeding
        if (await context.Brands.AnyAsync()) return;

        // ─── 1. CATEGORIES ────────────────────────────────────────────────────────
        var smartphones = new Category { Id = Guid.NewGuid(), Name = "Smartphones", Slug = "smartphones" };
        var tablets = new Category { Id = Guid.NewGuid(), Name = "Tablets", Slug = "tablets" };
        var laptops = new Category { Id = Guid.NewGuid(), Name = "Laptops", Slug = "laptops" };
        var wearables = new Category { Id = Guid.NewGuid(), Name = "Wearables", Slug = "wearables" };
        var audioGaming = new Category { Id = Guid.NewGuid(), Name = "Audio & Gaming", Slug = "audio-gaming" };
        
        context.Categories.AddRange(smartphones, tablets, laptops, wearables, audioGaming);

        // ─── 2. BRANDS ────────────────────────────────────────────────────────────
        var apple = new Brand { Id = Guid.NewGuid(), Name = "Apple" };
        var samsung = new Brand { Id = Guid.NewGuid(), Name = "Samsung" };
        var google = new Brand { Id = Guid.NewGuid(), Name = "Google" };
        var sony = new Brand { Id = Guid.NewGuid(), Name = "Sony" };
        var xiaomi = new Brand { Id = Guid.NewGuid(), Name = "Xiaomi" };
        
        context.Brands.AddRange(apple, samsung, google, sony, xiaomi);

        // ─── 3. DEVICE FAMILIES (The Product Lines) ───────────────────────────────
        
        // Apple
        var ip15pm = new DeviceFamily { Id = Guid.NewGuid(), BrandId = apple.Id, CategoryId = smartphones.Id, Name = "iPhone 15 Pro Max" };
        var ip15p = new DeviceFamily { Id = Guid.NewGuid(), BrandId = apple.Id, CategoryId = smartphones.Id, Name = "iPhone 15 Pro" };
        var ip14p = new DeviceFamily { Id = Guid.NewGuid(), BrandId = apple.Id, CategoryId = smartphones.Id, Name = "iPhone 14 Pro" };
        var ip13 = new DeviceFamily { Id = Guid.NewGuid(), BrandId = apple.Id, CategoryId = smartphones.Id, Name = "iPhone 13" };
        var ipadPro = new DeviceFamily { Id = Guid.NewGuid(), BrandId = apple.Id, CategoryId = tablets.Id, Name = "iPad Pro 12.9 M2" };
        var macbookM3 = new DeviceFamily { Id = Guid.NewGuid(), BrandId = apple.Id, CategoryId = laptops.Id, Name = "MacBook Pro 14 M3" };
        var watchUltra = new DeviceFamily { Id = Guid.NewGuid(), BrandId = apple.Id, CategoryId = wearables.Id, Name = "Apple Watch Ultra 2" };
        var airpodsPro = new DeviceFamily { Id = Guid.NewGuid(), BrandId = apple.Id, CategoryId = audioGaming.Id, Name = "AirPods Pro 2" };

        // Samsung
        var s24u = new DeviceFamily { Id = Guid.NewGuid(), BrandId = samsung.Id, CategoryId = smartphones.Id, Name = "Galaxy S24 Ultra" };
        var s23u = new DeviceFamily { Id = Guid.NewGuid(), BrandId = samsung.Id, CategoryId = smartphones.Id, Name = "Galaxy S23 Ultra" };
        var zfold5 = new DeviceFamily { Id = Guid.NewGuid(), BrandId = samsung.Id, CategoryId = smartphones.Id, Name = "Galaxy Z Fold 5" };
        var tabS9 = new DeviceFamily { Id = Guid.NewGuid(), BrandId = samsung.Id, CategoryId = tablets.Id, Name = "Galaxy Tab S9 Ultra" };

        // Google
        var pix8p = new DeviceFamily { Id = Guid.NewGuid(), BrandId = google.Id, CategoryId = smartphones.Id, Name = "Pixel 8 Pro" };
        var pixFold = new DeviceFamily { Id = Guid.NewGuid(), BrandId = google.Id, CategoryId = smartphones.Id, Name = "Pixel Fold" };

        // Sony
        var ps5 = new DeviceFamily { Id = Guid.NewGuid(), BrandId = sony.Id, CategoryId = audioGaming.Id, Name = "PlayStation 5" };
        var wh1000 = new DeviceFamily { Id = Guid.NewGuid(), BrandId = sony.Id, CategoryId = audioGaming.Id, Name = "Sony WH-1000XM5" };

        // Xiaomi
        var mi14u = new DeviceFamily { Id = Guid.NewGuid(), BrandId = xiaomi.Id, CategoryId = smartphones.Id, Name = "Xiaomi 14 Ultra" };

        context.DeviceFamilies.AddRange(ip15pm, ip15p, ip14p, ip13, ipadPro, macbookM3, watchUltra, airpodsPro, s24u, s23u, zfold5, tabS9, pix8p, pixFold, ps5, wh1000, mi14u);

        // ─── 4. VALUATION FORMULA CONFIGS ─────────────────────────────────────────
        context.ValuationFormulaConfigs.AddRange(new List<ValuationFormulaConfig> {
            new ValuationFormulaConfig { Id = Guid.NewGuid(), ModelName = "iPhone 15 Pro Max", BaseValue = 1700000m, MonthlyDepreciationMultiplier = 0.012m, MarketDemandFactor = 1.15m },
            new ValuationFormulaConfig { Id = Guid.NewGuid(), ModelName = "iPhone 15 Pro", BaseValue = 1400000m, MonthlyDepreciationMultiplier = 0.015m, MarketDemandFactor = 1.10m },
            new ValuationFormulaConfig { Id = Guid.NewGuid(), ModelName = "iPhone 14 Pro", BaseValue = 1050000m, MonthlyDepreciationMultiplier = 0.018m, MarketDemandFactor = 1.05m },
            new ValuationFormulaConfig { Id = Guid.NewGuid(), ModelName = "iPhone 13", BaseValue = 600000m, MonthlyDepreciationMultiplier = 0.022m, MarketDemandFactor = 1.00m },
            new ValuationFormulaConfig { Id = Guid.NewGuid(), ModelName = "iPad Pro 12.9 M2", BaseValue = 1600000m, MonthlyDepreciationMultiplier = 0.020m, MarketDemandFactor = 1.00m },
            new ValuationFormulaConfig { Id = Guid.NewGuid(), ModelName = "MacBook Pro 14 M3", BaseValue = 2800000m, MonthlyDepreciationMultiplier = 0.010m, MarketDemandFactor = 1.20m },
            new ValuationFormulaConfig { Id = Guid.NewGuid(), ModelName = "Apple Watch Ultra 2", BaseValue = 1000000m, MonthlyDepreciationMultiplier = 0.025m, MarketDemandFactor = 1.05m },
            new ValuationFormulaConfig { Id = Guid.NewGuid(), ModelName = "AirPods Pro 2", BaseValue = 250000m, MonthlyDepreciationMultiplier = 0.035m, MarketDemandFactor = 0.90m },
            
            new ValuationFormulaConfig { Id = Guid.NewGuid(), ModelName = "Galaxy S24 Ultra", BaseValue = 1600000m, MonthlyDepreciationMultiplier = 0.015m, MarketDemandFactor = 1.05m },
            new ValuationFormulaConfig { Id = Guid.NewGuid(), ModelName = "Galaxy S23 Ultra", BaseValue = 1000000m, MonthlyDepreciationMultiplier = 0.020m, MarketDemandFactor = 1.00m },
            new ValuationFormulaConfig { Id = Guid.NewGuid(), ModelName = "Galaxy Z Fold 5", BaseValue = 1400000m, MonthlyDepreciationMultiplier = 0.030m, MarketDemandFactor = 0.95m },
            new ValuationFormulaConfig { Id = Guid.NewGuid(), ModelName = "Galaxy Tab S9 Ultra", BaseValue = 1500000m, MonthlyDepreciationMultiplier = 0.025m, MarketDemandFactor = 0.95m },
            
            new ValuationFormulaConfig { Id = Guid.NewGuid(), ModelName = "Pixel 8 Pro", BaseValue = 1100000m, MonthlyDepreciationMultiplier = 0.020m, MarketDemandFactor = 0.90m },
            new ValuationFormulaConfig { Id = Guid.NewGuid(), ModelName = "Pixel Fold", BaseValue = 1500000m, MonthlyDepreciationMultiplier = 0.035m, MarketDemandFactor = 0.85m },
            
            new ValuationFormulaConfig { Id = Guid.NewGuid(), ModelName = "PlayStation 5", BaseValue = 650000m, MonthlyDepreciationMultiplier = 0.008m, MarketDemandFactor = 1.20m },
            new ValuationFormulaConfig { Id = Guid.NewGuid(), ModelName = "Sony WH-1000XM5", BaseValue = 400000m, MonthlyDepreciationMultiplier = 0.020m, MarketDemandFactor = 0.95m },
            
            new ValuationFormulaConfig { Id = Guid.NewGuid(), ModelName = "Xiaomi 14 Ultra", BaseValue = 1500000m, MonthlyDepreciationMultiplier = 0.025m, MarketDemandFactor = 0.90m }
        });

        // ─── 5. DEVICE VARIANTS ───────────────────────────────────────────────────
        var v15pmNat = new DeviceVariant { Id = Guid.NewGuid(), DeviceFamilyId = ip15pm.Id, StorageCapacity = "256GB", Color = "Natural Titanium", ImageUrl = "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1000&auto=format&fit=crop" };
        var v15pBlk = new DeviceVariant { Id = Guid.NewGuid(), DeviceFamilyId = ip15p.Id, StorageCapacity = "512GB", Color = "Black Titanium", ImageUrl = "https://images.unsplash.com/photo-1696446700622-4a0058b846e4?q=80&w=1000&auto=format&fit=crop" };
        var v14pPurp = new DeviceVariant { Id = Guid.NewGuid(), DeviceFamilyId = ip14p.Id, StorageCapacity = "256GB", Color = "Deep Purple", ImageUrl = "https://images.unsplash.com/photo-1663314980642-f83492a472bc?q=80&w=1000&auto=format&fit=crop" };
        var v13Mid = new DeviceVariant { Id = Guid.NewGuid(), DeviceFamilyId = ip13.Id, StorageCapacity = "128GB", Color = "Midnight", ImageUrl = "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?q=80&w=1000&auto=format&fit=crop" };
        
        var vMacM3Sil = new DeviceVariant { Id = Guid.NewGuid(), DeviceFamilyId = macbookM3.Id, StorageCapacity = "1TB SSD", Color = "Silver", ImageUrl = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1000&auto=format&fit=crop" };
        var vIpadGry = new DeviceVariant { Id = Guid.NewGuid(), DeviceFamilyId = ipadPro.Id, StorageCapacity = "256GB", Color = "Space Gray", ImageUrl = "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=1000&auto=format&fit=crop" };
        var vWatchUlt = new DeviceVariant { Id = Guid.NewGuid(), DeviceFamilyId = watchUltra.Id, StorageCapacity = "64GB", Color = "Titanium Orange Alpine Loop", ImageUrl = "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?q=80&w=1000&auto=format&fit=crop" };
        var vAirpods = new DeviceVariant { Id = Guid.NewGuid(), DeviceFamilyId = airpodsPro.Id, StorageCapacity = "Standard", Color = "White", ImageUrl = "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=1000&auto=format&fit=crop" };

        var vS24uTtn = new DeviceVariant { Id = Guid.NewGuid(), DeviceFamilyId = s24u.Id, StorageCapacity = "512GB", Color = "Titanium Gray", ImageUrl = "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=1000&auto=format&fit=crop" };
        var vFold5Icy = new DeviceVariant { Id = Guid.NewGuid(), DeviceFamilyId = zfold5.Id, StorageCapacity = "512GB", Color = "Icy Blue", ImageUrl = "https://images.unsplash.com/photo-1658428588882-969446fde384?q=80&w=1000&auto=format&fit=crop" };
        
        var vPix8pObs = new DeviceVariant { Id = Guid.NewGuid(), DeviceFamilyId = pix8p.Id, StorageCapacity = "256GB", Color = "Obsidian", ImageUrl = "https://images.unsplash.com/photo-1678911820864-e1c5ce8742b6?q=80&w=1000&auto=format&fit=crop" };
        
        var vPs5 = new DeviceVariant { Id = Guid.NewGuid(), DeviceFamilyId = ps5.Id, StorageCapacity = "1TB", Color = "White/Black", ImageUrl = "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=1000&auto=format&fit=crop" };
        var vSonyAudio = new DeviceVariant { Id = Guid.NewGuid(), DeviceFamilyId = wh1000.Id, StorageCapacity = "N/A", Color = "Silver", ImageUrl = "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=1000&auto=format&fit=crop" };
        
        var vMi14uWht = new DeviceVariant { Id = Guid.NewGuid(), DeviceFamilyId = mi14u.Id, StorageCapacity = "512GB", Color = "Vegan Leather White", ImageUrl = "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=1000&auto=format&fit=crop" };

        context.DeviceVariants.AddRange(v15pmNat, v15pBlk, v14pPurp, v13Mid, vMacM3Sil, vIpadGry, vWatchUlt, vAirpods, vS24uTtn, vFold5Icy, vPix8pObs, vPs5, vSonyAudio, vMi14uWht);

        // ─── 6. PHYSICAL INVENTORY UNITS ──────────────────────────────────────────
        context.InventoryUnits.AddRange(new List<InventoryUnit>
        {
            // Apple Phones
            new InventoryUnit { Id = Guid.NewGuid(), DeviceVariantId = v15pmNat.Id, SerialNumber = "SN-AP-001", SellingPrice = 1850000m, RetailState = RetailState.BrandNew, Status = ItemStatus.Available },
            new InventoryUnit { Id = Guid.NewGuid(), DeviceVariantId = v15pmNat.Id, SerialNumber = "SN-AP-002", SellingPrice = 1600000m, RetailState = RetailState.PreOwned, ConditionGrade = ConditionGrade.Excellent, Status = ItemStatus.Available },
            new InventoryUnit { Id = Guid.NewGuid(), DeviceVariantId = v15pBlk.Id, SerialNumber = "SN-AP-003", SellingPrice = 1550000m, RetailState = RetailState.BrandNew, Status = ItemStatus.Available },
            new InventoryUnit { Id = Guid.NewGuid(), DeviceVariantId = v14pPurp.Id, SerialNumber = "SN-AP-004", SellingPrice = 1150000m, RetailState = RetailState.PreOwned, ConditionGrade = ConditionGrade.Excellent, Status = ItemStatus.Available },
            new InventoryUnit { Id = Guid.NewGuid(), DeviceVariantId = v13Mid.Id, SerialNumber = "SN-AP-005", SellingPrice = 650000m, RetailState = RetailState.Refurbished, ConditionGrade = ConditionGrade.Good, Status = ItemStatus.Available },

            // Apple Computing & Gadgets
            new InventoryUnit { Id = Guid.NewGuid(), DeviceVariantId = vMacM3Sil.Id, SerialNumber = "SN-MAC-001", SellingPrice = 3200000m, RetailState = RetailState.BrandNew, Status = ItemStatus.Available },
            new InventoryUnit { Id = Guid.NewGuid(), DeviceVariantId = vMacM3Sil.Id, SerialNumber = "SN-MAC-002", SellingPrice = 2850000m, RetailState = RetailState.PreOwned, ConditionGrade = ConditionGrade.Excellent, Status = ItemStatus.Available },
            new InventoryUnit { Id = Guid.NewGuid(), DeviceVariantId = vIpadGry.Id, SerialNumber = "SN-IPD-001", SellingPrice = 1800000m, RetailState = RetailState.BrandNew, Status = ItemStatus.Available },
            new InventoryUnit { Id = Guid.NewGuid(), DeviceVariantId = vWatchUlt.Id, SerialNumber = "SN-AW-001", SellingPrice = 1150000m, RetailState = RetailState.BrandNew, Status = ItemStatus.Available },
            new InventoryUnit { Id = Guid.NewGuid(), DeviceVariantId = vAirpods.Id, SerialNumber = "SN-APP-001", SellingPrice = 350000m, RetailState = RetailState.BrandNew, Status = ItemStatus.Available },

            // Samsung
            new InventoryUnit { Id = Guid.NewGuid(), DeviceVariantId = vS24uTtn.Id, SerialNumber = "SN-SM-001", SellingPrice = 1750000m, RetailState = RetailState.BrandNew, Status = ItemStatus.Available },
            new InventoryUnit { Id = Guid.NewGuid(), DeviceVariantId = vS24uTtn.Id, SerialNumber = "SN-SM-002", SellingPrice = 1450000m, RetailState = RetailState.PreOwned, ConditionGrade = ConditionGrade.Excellent, Status = ItemStatus.Available },
            new InventoryUnit { Id = Guid.NewGuid(), DeviceVariantId = vFold5Icy.Id, SerialNumber = "SN-SM-003", SellingPrice = 1800000m, RetailState = RetailState.BrandNew, Status = ItemStatus.Available },
            
            // Google
            new InventoryUnit { Id = Guid.NewGuid(), DeviceVariantId = vPix8pObs.Id, SerialNumber = "SN-GG-001", SellingPrice = 1250000m, RetailState = RetailState.BrandNew, Status = ItemStatus.Available },
            new InventoryUnit { Id = Guid.NewGuid(), DeviceVariantId = vPix8pObs.Id, SerialNumber = "SN-GG-002", SellingPrice = 950000m, RetailState = RetailState.PreOwned, ConditionGrade = ConditionGrade.Fair, Status = ItemStatus.Available },

            // Sony & Gaming
            new InventoryUnit { Id = Guid.NewGuid(), DeviceVariantId = vPs5.Id, SerialNumber = "SN-SNY-001", SellingPrice = 850000m, RetailState = RetailState.BrandNew, Status = ItemStatus.Available },
            new InventoryUnit { Id = Guid.NewGuid(), DeviceVariantId = vPs5.Id, SerialNumber = "SN-SNY-002", SellingPrice = 650000m, RetailState = RetailState.PreOwned, ConditionGrade = ConditionGrade.Good, Status = ItemStatus.Available },
            new InventoryUnit { Id = Guid.NewGuid(), DeviceVariantId = vSonyAudio.Id, SerialNumber = "SN-SNY-003", SellingPrice = 480000m, RetailState = RetailState.BrandNew, Status = ItemStatus.Available },

            // Xiaomi
            new InventoryUnit { Id = Guid.NewGuid(), DeviceVariantId = vMi14uWht.Id, SerialNumber = "SN-XM-001", SellingPrice = 1650000m, RetailState = RetailState.BrandNew, Status = ItemStatus.Available }
        });

        // 7. FINALIZE AND PUSH TO POSTGRESQL
        await context.SaveChangesAsync();
    }
}
using IKPhones.Api.DTOs;
using IKPhones.API.Services;
using IKPhones.Core.Entities;
using IKPhones.Core.Enums;
using EmberzBackend.Enums;
using IKPhones.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;

namespace IKPhones.Api.Controllers;

[ApiController]
[Route("api/admin/inventory")]
// [Authorize(Roles = "Admin, Staff")] 
public class AdminInventoryController : ControllerBase
{
    private readonly IKPhonesDbContext _dbContext;
    private readonly FileUploadService _fileUploadService;

    public AdminInventoryController(IKPhonesDbContext dbContext, FileUploadService fileUploadService)
    {
        _dbContext = dbContext;
        _fileUploadService = fileUploadService;
    }

    // ─── 1. THE "GOD ENDPOINT": CREATE FULL PRODUCT LINE ────────────────────
    [HttpPost("create-product-line")]
    public async Task<IActionResult> CreateProductLine([FromBody] CreateProductRequest request)
    {
        // 1. Resolve or Create Category
        var category = await _dbContext.Categories.FirstOrDefaultAsync(c => c.Name.ToLower() == request.CategoryName.ToLower());
        if (category == null)
        {
            category = new Category { Id = Guid.NewGuid(), Name = request.CategoryName, Slug = request.CategoryName.ToLower().Replace(" ", "-") };
            _dbContext.Categories.Add(category);
        }

        // 2. Resolve or Create Brand
        var brand = await _dbContext.Brands.FirstOrDefaultAsync(b => b.Name.ToLower() == request.BrandName.ToLower());
        if (brand == null)
        {
            brand = new Brand { Id = Guid.NewGuid(), Name = request.BrandName };
            _dbContext.Brands.Add(brand);
        }

        // 3. Resolve or Create Device Family
        var family = await _dbContext.DeviceFamilies.FirstOrDefaultAsync(df => df.Name.ToLower() == request.ModelName.ToLower() && df.BrandId == brand.Id);
        if (family == null)
        {
            family = new DeviceFamily { Id = Guid.NewGuid(), BrandId = brand.Id, CategoryId = category.Id, Name = request.ModelName };
            _dbContext.DeviceFamilies.Add(family);
        }

        // 4. Check for Existing Variant
        var variantExists = await _dbContext.DeviceVariants.AnyAsync(v => 
            v.DeviceFamilyId == family.Id && 
            v.StorageCapacity.ToLower() == request.Storage.ToLower() && 
            v.Color.ToLower() == request.Color.ToLower());

        if (variantExists) return Conflict(new { Message = "This specific variant already exists in the system." });

        // 5. Create Variant
        var newVariant = new DeviceVariant
        {
            Id = Guid.NewGuid(),
            DeviceFamilyId = family.Id,
            StorageCapacity = request.Storage.Trim(),
            Color = request.Color.Trim(),
            ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000" : request.ImageUrl
        };

        _dbContext.DeviceVariants.Add(newVariant);
        await _dbContext.SaveChangesAsync();

        return Ok(new { VariantId = newVariant.Id, Message = $"Successfully created {brand.Name} {family.Name} ({newVariant.StorageCapacity} - {newVariant.Color})" });
    }

    // ─── 2. THE UPGRADED BULK INJECTOR (WITH AUTO-SERIALS) ──────────────────
    [HttpPost("add-stock")]
    public async Task<IActionResult> AddStock([FromBody] AddStockRequest request)
    {
        var variantExists = await _dbContext.DeviceVariants.AnyAsync(v => v.Id == request.DeviceVariantId);
        if (!variantExists) return NotFound("The specified device variant does not exist.");

        if (!Enum.TryParse<RetailState>(request.RetailState, true, out var retailState))
            return BadRequest("Invalid RetailState.");

        ConditionGrade? conditionGrade = null;
        if (!string.IsNullOrWhiteSpace(request.ConditionGrade) && request.RetailState != "BrandNew")
        {
            if (Enum.TryParse<ConditionGrade>(request.ConditionGrade, true, out var parsedGrade))
                conditionGrade = parsedGrade;
        }

        var serialsToInject = new List<string>();

        // THE FIX: If AutoGenerate is true, generate random unique IDs based on the requested quantity
        if (request.AutoGenerateSerials)
        {
            if (request.Quantity <= 0) return BadRequest("Quantity must be at least 1.");
            for (int i = 0; i < request.Quantity; i++)
            {
                serialsToInject.Add($"AUTO-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}");
            }
        }
        else
        {
            // Otherwise, use the manually provided serials
            if (request.SerialNumbers == null || !request.SerialNumbers.Any()) 
                return BadRequest("Must provide at least one serial number or enable Auto-Generate.");
            serialsToInject = request.SerialNumbers;
        }

        // Check for duplicates
        var existingSerials = await _dbContext.InventoryUnits
            .Where(u => serialsToInject.Contains(u.SerialNumber))
            .Select(u => u.SerialNumber)
            .ToListAsync();

        if (existingSerials.Any())
            return Conflict(new { Message = "Duplicate serial numbers detected.", Duplicates = existingSerials });

        // Inject the units
        var newUnits = serialsToInject.Select(serial => new InventoryUnit
        {
            Id = Guid.NewGuid(),
            DeviceVariantId = request.DeviceVariantId,
            SerialNumber = serial.Trim(),
            SellingPrice = request.SellingPrice,
            RetailState = retailState,
            ConditionGrade = conditionGrade,
            Status = ItemStatus.Available
        }).ToList();

        _dbContext.InventoryUnits.AddRange(newUnits);
        await _dbContext.SaveChangesAsync();

        return Ok(new { UnitsAdded = newUnits.Count, Message = $"Successfully injected {newUnits.Count} units." });
    }

    // ─── 3. GET VARIANTS FOR DROPDOWN ───────────────────────────────────────
    [HttpGet("variants")]
    public async Task<IActionResult> GetAllVariants()
    {
        var variants = await _dbContext.DeviceVariants
            .Include(v => v.DeviceFamily).ThenInclude(df => df.Brand)
            .ToListAsync();

        var result = variants
            .Select(v => new {
                Id = v.Id,
                DisplayName = $"{v.DeviceFamily.Brand.Name} {v.DeviceFamily.Name} | {v.StorageCapacity} - {v.Color}"
            })
            .OrderBy(v => v.DisplayName)
            .ToList();

        return Ok(result);
    }

    // ─── 0. UPLOAD DEVICE IMAGES ────────────────────────────────────────────
    [HttpPost("upload-image")]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("No file provided.");

        try
        {
            var relativePath = await _fileUploadService.UploadDeviceImageAsync(file);
            
            // Note: Returning 'Url' matches the response.url we look for in React
            return Ok(new { Url = relativePath, Message = "Image successfully saved to local wwwroot." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error during upload: {ex.Message}");
        }
    }

    
}

// ─── DTOs ───────────────────────────────────────────────────────────────
public class CreateProductRequest
{
    public required string CategoryName { get; set; }
    public required string BrandName { get; set; }
    public required string ModelName { get; set; }
    public required string Storage { get; set; }
    public required string Color { get; set; }
    public string? ImageUrl { get; set; }
}

public class AddStockRequest
{
    public Guid DeviceVariantId { get; set; }
    public required string RetailState { get; set; }
    public string? ConditionGrade { get; set; }
    public decimal SellingPrice { get; set; }
    
    // Auto-Generate Fields
    public bool AutoGenerateSerials { get; set; }
    public int Quantity { get; set; }
    public List<string>? SerialNumbers { get; set; }
}
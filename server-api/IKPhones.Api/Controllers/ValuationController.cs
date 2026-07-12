using IKPhones.Api.DTOs;
using IKPhones.Application.Interfaces;
using IKPhones.Core.Entities;
using IKPhones.Infrastructure.Data;
using EmberzBackend.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using IKPhones.Core.Enums;

namespace IKPhones.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ValuationController : ControllerBase
{
    private readonly IValuationEngine _valuationEngine;
    private readonly IKPhonesDbContext _dbContext;

    public ValuationController(IValuationEngine valuationEngine, IKPhonesDbContext dbContext)
    {
        _valuationEngine = valuationEngine;
        _dbContext = dbContext;
    }

    [HttpPost("estimate")]
    public async Task<IActionResult> GetInstantEstimate([FromBody] DeviceValuation request)
    {
        // 1. Locate configuration rules
        var config = await _dbContext.ValuationFormulaConfigs
            .FirstOrDefaultAsync(c => c.ModelName.ToLower() == request.ModelName.ToLower());

        // Capture the original admin-configured value to use as a safety net later
        decimal originalAdminConfiguredValue = config?.BaseValue ?? 0;

        // ─── FIX: DYNAMIC BLUEPRINT CONFIGURATION FOR ADMIN REGISTERED MODELS ───
        if (config == null)
        {
            var deviceExists = await _dbContext.DeviceFamilies.AnyAsync(df => df.Name.ToLower() == request.ModelName.ToLower());
            if (!deviceExists)
            {
                return BadRequest(new { Error = $"The device architecture for '{request.ModelName}' is unrecognized by the platform registry." });
            }

            // Create an on-the-fly valuation configuration fallback structure
            // Create an on-the-fly valuation configuration fallback structure
            config = new ValuationFormulaConfig
            {
                Id = Guid.NewGuid(),
                ModelName = request.ModelName,
                BaseValue = 0, 
                MonthlyDepreciationMultiplier = 0.0350m, // FIX: 3.5% compound decay per month
                MarketDemandFactor = 1.00m
            };
        }

        // 2. Dynamic market parsing from physical inventory data streams
        var activeMarketUnits = await _dbContext.InventoryUnits
            .Include(u => u.Variant)
                .ThenInclude(v => v.DeviceFamily)
            .Where(u => u.Variant.DeviceFamily.Name.ToLower() == request.ModelName.ToLower() && u.Status == IKPhones.Core.Enums.ItemStatus.Available)
            .ToListAsync();

        if (activeMarketUnits.Any())
        {
            // Find the average price to establish a baseline of reality
            var averagePrice = activeMarketUnits.Average(u => u.SellingPrice);
            
            // Ignore any unit that is less than 60% of the average price (stricter typo filter)
            var validMarketUnits = activeMarketUnits.Where(u => u.SellingPrice >= (averagePrice * 0.6m)).ToList();

            decimal lowestValidMarketPrice = validMarketUnits.Any() 
                ? validMarketUnits.Min(u => u.SellingPrice) 
                : activeMarketUnits.Min(u => u.SellingPrice);

            // ─── TYPO OVERRIDE SAFETY NET ───
            if (originalAdminConfiguredValue > 0 && lowestValidMarketPrice < (originalAdminConfiguredValue * 0.5m))
            {
                config.BaseValue = originalAdminConfiguredValue;
            }
            else
            {
                config.BaseValue = lowestValidMarketPrice;
            }
            
            // ─── PROFIT MARGIN FIX ───
            // Apply a strict 35% wholesale margin haircut. 
            config.BaseValue = config.BaseValue * 0.65m; 
        }
        else if (config.BaseValue == 0)
        {
             // Absolute fallback if no market units exist at all
             config.BaseValue = 500000.00m;
        }

        // 3. Process offer through valuation algorithms (Age & Condition drops applied here)
        var finalEstimate = _valuationEngine.CalculateInstantEstimate(request, config);
        
        request.Id = Guid.NewGuid();
        request.CalculatedValue = finalEstimate;
        request.FinalApprovedValue = finalEstimate;
        request.CreatedAtUtc = DateTime.UtcNow;

        _dbContext.DeviceValuations.Add(request);
        await _dbContext.SaveChangesAsync();
        
        return Ok(new 
        { 
            ValuationId = request.Id,
            Model = request.ModelName,
            EstimatedValue = finalEstimate,
            Message = "Valuation successful. Book an in-store inspection to lock in this price."
        });
    }

    [HttpPost("book")]
    public async Task<IActionResult> BookInspection([FromBody] BookInspectionRequest request)
    {
        if (request == null) return BadRequest("Booking payload details cannot be missing.");

        var originalValuation = await _dbContext.DeviceValuations
            .AnyAsync(v => v.Id == request.DeviceValuationId);

        if (!originalValuation) return NotFound("The referenced device valuation snapshot record does not exist.");

        if (request.InspectionDateUtc < DateTime.UtcNow) return BadRequest("Inspection appointments must be scheduled for a future date.");

        try
        {
            var lead = new TradeInLead
            {
                Id = Guid.NewGuid(),
                CustomerName = request.CustomerName.Trim(),
                CustomerEmail = request.CustomerEmail.Trim().ToLower(),
                CustomerPhone = request.CustomerPhone.Trim(),
                DeviceValuationId = request.DeviceValuationId,
                QuotedValue = request.QuotedValue,
                InspectionDateUtc = request.InspectionDateUtc,
                CreatedAtUtc = DateTime.UtcNow
            };

            _dbContext.TradeInLeads.Add(lead);
            await _dbContext.SaveChangesAsync();

            return Ok(new
            {
                LeadId = lead.Id,
                CustomerName = lead.CustomerName,
                ScheduledFor = lead.InspectionDateUtc,
                Message = "In-store drop-off appointment secured successfully. Our team expects your arrival."
            });
        }
        catch (Exception)
        {
            return StatusCode(500, "A database error occurred while creating your trade-in booking lead.");
        }
    }
}
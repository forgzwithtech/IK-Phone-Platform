using IKPhones.Application.Interfaces;
using IKPhones.Core.Entities;
using IKPhones.Core.Enums;
using System;

namespace IKPhones.Application.Services;

public class ValuationEngine : IValuationEngine
{
    public decimal CalculateInstantEstimate(DeviceValuation valuation, ValuationFormulaConfig config)
    {
        // 1. COMPOUND EXPONENTIAL DECAY: (1 - M)^Age
        // Example: (1 - 0.035) ^ 24 months = 0.425 (Phone retains 42.5% of its value after 2 years)
        double retentionRatePerMonth = (double)(1.0m - config.MonthlyDepreciationMultiplier);
        
        decimal ageDepreciation = (decimal)Math.Pow(retentionRatePerMonth, valuation.AgeInMonths);
        
        // Safety Floor: Never drop below 15% of the wholesale value just because of age
        if (ageDepreciation < 0.15m) ageDepreciation = 0.15m; 

        // 2. Convert condition grades to functional decimal coefficients
        decimal cBody = (decimal)valuation.BodyCondition / 100m;
        decimal cScreen = (decimal)valuation.ScreenCondition / 100m;

        // 3. Execute core formula logic
        decimal finalValue = config.BaseValue 
                             * ageDepreciation 
                             * cBody 
                             * cScreen 
                             * config.MarketDemandFactor;

        // Round cleanly to standard currency formats
        return Math.Round(finalValue, 2);
    }
}
namespace IKPhones.Core.Entities;

public class ValuationFormulaConfig
{
    public Guid Id { get; set; }
    public required string ModelName { get; set; }
    public decimal BaseValue { get; set; }
    public decimal MonthlyDepreciationMultiplier { get; set; } // "M" in the formula
    public decimal MarketDemandFactor { get; set; }            // "M_demand" in the formula
    public DateTime LastUpdatedUtc { get; set; } = DateTime.UtcNow;
}
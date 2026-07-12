using IKPhones.Core.Entities;

namespace IKPhones.Application.Interfaces;

public interface IValuationEngine
{
    decimal CalculateInstantEstimate(DeviceValuation valuation, ValuationFormulaConfig config);
}
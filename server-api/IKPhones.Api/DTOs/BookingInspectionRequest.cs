using System;

namespace IKPhones.Api.DTOs;

public class BookInspectionRequest
{
    public required string CustomerName { get; set; }
    public required string CustomerEmail { get; set; }
    public required string CustomerPhone { get; set; }
    
    // Links directly to the calculation history row generated during the calculation step
    public Guid DeviceValuationId { get; set; }
    
    // The value locked in from the calculation display
    public decimal QuotedValue { get; set; }
    
    // The intended drop-off / inspection timestamp selected by the customer
    public DateTime InspectionDateUtc { get; set; }
}
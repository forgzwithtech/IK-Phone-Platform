using IKPhones.Core.Enums;

namespace IKPhones.Core.Entities;

public class DeviceValuation
{
    public Guid Id { get; set; }
    public required string ModelName { get; set; }
    public int AgeInMonths { get; set; }
    public ConditionGrade BodyCondition { get; set; }
    public ConditionGrade ScreenCondition { get; set; }
    public decimal CalculatedValue { get; set; }
    public decimal FinalApprovedValue { get; set; }
    public bool IsApprovedByAdmin { get; set; } = false;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    // Storing permanent Cloud Storage URLs instead of raw files
    public List<string> ImageUrls { get; set; } = new();
}
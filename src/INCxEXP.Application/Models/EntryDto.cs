using INCxEXP.Core.Entities;

namespace INCxEXP.Application.Models;

public class EntryDto
{
    public Guid Id { get; set; }
    public EntryType Type { get; set; }
    public decimal Amount { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

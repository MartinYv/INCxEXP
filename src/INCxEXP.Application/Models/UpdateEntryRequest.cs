using System.ComponentModel.DataAnnotations;
using INCxEXP.Core.Entities;

namespace INCxEXP.Application.Models;

public class UpdateEntryRequest
{
    public EntryType Type { get; set; }

    [Range(typeof(decimal), "0.0000001", "79228162514264337593543950335", ErrorMessage = "Amount must be greater than 0.")]
    public decimal Amount { get; set; }

    [Required(ErrorMessage = "Category is required.")]
    [StringLength(40, ErrorMessage = "Category must be 40 characters or fewer.")]
    public string Category { get; set; } = string.Empty;

    [StringLength(200, ErrorMessage = "Description must be 200 characters or fewer.")]
    public string? Description { get; set; }
}

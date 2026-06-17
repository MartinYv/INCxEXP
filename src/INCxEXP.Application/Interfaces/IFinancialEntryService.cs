using INCxEXP.Application.Models;

namespace INCxEXP.Application.Interfaces;

public interface IFinancialEntryService
{
    Task<IEnumerable<EntryDto>> GetForUserAsync(string userId, CancellationToken cancellationToken = default);
    Task<EntryDto?> GetByIdAsync(Guid id, string userId, CancellationToken cancellationToken = default);
    Task<EntryDto> CreateAsync(string userId, CreateEntryRequest request, CancellationToken cancellationToken = default);
    Task<EntryDto> UpdateAsync(Guid id, string userId, UpdateEntryRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, string userId, CancellationToken cancellationToken = default);
}

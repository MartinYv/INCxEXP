using INCxEXP.Core.Entities;

namespace INCxEXP.Application.Interfaces;

public interface IFinancialEntryRepository
{
    Task<IEnumerable<FinancialEntry>> GetByUserAsync(string userId, CancellationToken cancellationToken = default);
    Task<FinancialEntry?> GetByIdAsync(Guid id, string userId, CancellationToken cancellationToken = default);
    Task<FinancialEntry> AddAsync(FinancialEntry entry, CancellationToken cancellationToken = default);
    Task<FinancialEntry> UpdateAsync(FinancialEntry entry, CancellationToken cancellationToken = default);
    Task DeleteAsync(FinancialEntry entry, CancellationToken cancellationToken = default);
}

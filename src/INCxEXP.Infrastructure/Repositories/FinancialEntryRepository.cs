using INCxEXP.Application.Interfaces;
using INCxEXP.Core.Entities;
using INCxEXP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace INCxEXP.Infrastructure.Repositories;

public class FinancialEntryRepository : IFinancialEntryRepository
{
    private readonly ApplicationDbContext _context;

    public FinancialEntryRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<FinancialEntry> AddAsync(FinancialEntry entry, CancellationToken cancellationToken = default)
    {
        await _context.FinancialEntries.AddAsync(entry, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return entry;
    }

    public async Task<FinancialEntry?> GetByIdAsync(Guid id, string userId, CancellationToken cancellationToken = default)
    {
        return await _context.FinancialEntries
            .AsNoTracking()
            .FirstOrDefaultAsync(entry => entry.Id == id && entry.UserId == userId, cancellationToken);
    }

    public async Task<IEnumerable<FinancialEntry>> GetByUserAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _context.FinancialEntries
            .AsNoTracking()
            .Where(entry => entry.UserId == userId)
            .OrderByDescending(entry => entry.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<FinancialEntry> UpdateAsync(FinancialEntry entry, CancellationToken cancellationToken = default)
    {
        _context.FinancialEntries.Update(entry);
        await _context.SaveChangesAsync(cancellationToken);
        return entry;
    }

    public async Task DeleteAsync(FinancialEntry entry, CancellationToken cancellationToken = default)
    {
        _context.FinancialEntries.Remove(entry);
        await _context.SaveChangesAsync(cancellationToken);
    }
}

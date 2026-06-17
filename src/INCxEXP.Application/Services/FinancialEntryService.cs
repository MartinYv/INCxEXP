using INCxEXP.Application.Interfaces;
using INCxEXP.Application.Models;
using INCxEXP.Core.Entities;

namespace INCxEXP.Application.Services;

public class FinancialEntryService : IFinancialEntryService
{
    private readonly IFinancialEntryRepository _repository;

    public FinancialEntryService(IFinancialEntryRepository repository)
    {
        _repository = repository;
    }

    public async Task<EntryDto> CreateAsync(string userId, CreateEntryRequest request, CancellationToken cancellationToken = default)
    {
        var entry = new FinancialEntry
        {
            UserId = userId,
            Type = request.Type,
            Amount = request.Amount,
            Category = request.Category,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _repository.AddAsync(entry, cancellationToken);
        return MapToDto(created);
    }

    public async Task<EntryDto?> GetByIdAsync(Guid id, string userId, CancellationToken cancellationToken = default)
    {
        var entry = await _repository.GetByIdAsync(id, userId, cancellationToken);
        return entry is null ? null : MapToDto(entry);
    }

    public async Task<IEnumerable<EntryDto>> GetForUserAsync(string userId, CancellationToken cancellationToken = default)
    {
        var entries = await _repository.GetByUserAsync(userId, cancellationToken);
        return entries.Select(MapToDto);
    }

    public async Task<EntryDto> UpdateAsync(Guid id, string userId, UpdateEntryRequest request, CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetByIdAsync(id, userId, cancellationToken);
        if (existing is null)
        {
            throw new KeyNotFoundException("Entry not found.");
        }

        existing.Type = request.Type;
        existing.Amount = request.Amount;
        existing.Category = request.Category;
        existing.Description = request.Description;

        var updated = await _repository.UpdateAsync(existing, cancellationToken);
        return MapToDto(updated);
    }

    public async Task DeleteAsync(Guid id, string userId, CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetByIdAsync(id, userId, cancellationToken);
        if (existing is null)
        {
            return;
        }

        await _repository.DeleteAsync(existing, cancellationToken);
    }

    private static EntryDto MapToDto(FinancialEntry entry)
    {
        return new EntryDto
        {
            Id = entry.Id,
            Type = entry.Type,
            Amount = entry.Amount,
            Category = entry.Category,
            Description = entry.Description,
            CreatedAt = entry.CreatedAt
        };
    }
}

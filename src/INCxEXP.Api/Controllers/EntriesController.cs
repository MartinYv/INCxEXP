using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using INCxEXP.Application.Interfaces;
using INCxEXP.Application.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace INCxEXP.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EntriesController : ControllerBase
{
    private readonly IFinancialEntryService _service;

    public EntriesController(IFinancialEntryService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var entries = await _service.GetForUserAsync(userId, cancellationToken);
        return Ok(entries);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var entry = await _service.GetByIdAsync(id, userId, cancellationToken);
        if (entry is null)
        {
            return NotFound();
        }

        return Ok(entry);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEntryRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var created = await _service.CreateAsync(userId, request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEntryRequest request, CancellationToken cancellationToken)
    {
        return await UpdateInternal(id, request, cancellationToken);
    }

    [HttpPost("{id:guid}/update")]
    public async Task<IActionResult> UpdateViaPost(Guid id, [FromBody] UpdateEntryRequest request, CancellationToken cancellationToken)
    {
        return await UpdateInternal(id, request, cancellationToken);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        return await DeleteInternal(id, cancellationToken);
    }

    [HttpPost("{id:guid}/delete")]
    public async Task<IActionResult> DeleteViaPost(Guid id, CancellationToken cancellationToken)
    {
        return await DeleteInternal(id, cancellationToken);
    }

    private async Task<IActionResult> UpdateInternal(Guid id, UpdateEntryRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        try
        {
            var updated = await _service.UpdateAsync(id, userId, request, cancellationToken);
            return Ok(updated);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    private async Task<IActionResult> DeleteInternal(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        await _service.DeleteAsync(id, userId, cancellationToken);
        return NoContent();
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
    }
}

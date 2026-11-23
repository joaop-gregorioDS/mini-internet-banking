using Microsoft.EntityFrameworkCore;
using MiniBanking.Application.Abstractions;
using MiniBanking.Application.Common;
using MiniBanking.Domain.Entities;

namespace MiniBanking.Application.Statement;

public record StatementQuery(
    DateOnly? From = null,
    DateOnly? To = null,
    TransactionCategory? Category = null,
    int Page = 1,
    int PageSize = 20);

public record TransactionItem(
    Guid Id,
    DateTime CreatedAt,
    TransactionType Type,
    decimal Amount,
    TransactionCategory Category,
    string Description,
    string CounterpartyName);

public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount)
{
    public int TotalPages => PageSize == 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);
}

public interface IStatementService
{
    Task<PagedResult<TransactionItem>> GetAsync(Guid userId, StatementQuery query, CancellationToken ct = default);
}

public class StatementService(IAppDbContext db) : IStatementService
{
    public const int MaxPageSize = 100;

    public async Task<PagedResult<TransactionItem>> GetAsync(Guid userId, StatementQuery query, CancellationToken ct = default)
    {
        var accountId = await db.Accounts
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .Select(a => a.Id)
            .FirstOrDefaultAsync(ct);

        if (accountId == Guid.Empty)
            throw new NotFoundException("Conta não encontrada.");

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, MaxPageSize);

        var transactions = db.Transactions.AsNoTracking().Where(t => t.AccountId == accountId);

        if (query.From is { } from)
        {
            var start = from.ToDateTime(TimeOnly.MinValue);
            transactions = transactions.Where(t => t.CreatedAt >= start);
        }

        if (query.To is { } to)
        {
            var end = to.AddDays(1).ToDateTime(TimeOnly.MinValue);
            transactions = transactions.Where(t => t.CreatedAt < end);
        }

        if (query.Category is { } category)
            transactions = transactions.Where(t => t.Category == category);

        var total = await transactions.CountAsync(ct);

        var items = await transactions
            .OrderByDescending(t => t.CreatedAt)
            .ThenByDescending(t => t.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new TransactionItem(t.Id, t.CreatedAt, t.Type, t.Amount, t.Category, t.Description, t.CounterpartyName))
            .ToListAsync(ct);

        return new PagedResult<TransactionItem>(items, page, pageSize, total);
    }
}

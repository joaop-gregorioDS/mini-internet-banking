using Microsoft.EntityFrameworkCore;
using MiniBanking.Application.Abstractions;
using MiniBanking.Application.Common;
using MiniBanking.Domain;
using MiniBanking.Domain.Entities;

namespace MiniBanking.Application.Dashboard;

public record CategoryTotal(TransactionCategory Category, decimal Total);

public record DashboardSummary(
    int Year,
    int Month,
    decimal Balance,
    decimal MonthIncome,
    decimal MonthExpenses,
    IReadOnlyList<CategoryTotal> ExpensesByCategory);

public interface IDashboardService
{
    Task<DashboardSummary> GetSummaryAsync(Guid userId, int? year = null, int? month = null, CancellationToken ct = default);
}

public class DashboardService(IAppDbContext db, TimeProvider clock) : IDashboardService
{
    public async Task<DashboardSummary> GetSummaryAsync(Guid userId, int? year = null, int? month = null, CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        var y = year ?? today.Year;
        var m = month ?? today.Month;

        if (y < 2000 || y > 2100)
            throw new DomainException("Ano inválido.");
        if (m < 1 || m > 12)
            throw new DomainException("Mês inválido.");

        var account = await db.Accounts
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .Select(a => new { a.Id, a.Balance })
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("Conta não encontrada.");

        var start = new DateTime(y, m, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = start.AddMonths(1);

        // Agregação no banco: uma linha por (tipo, categoria) no mês.
        var flows = await db.Transactions
            .AsNoTracking()
            .Where(t => t.AccountId == account.Id && t.CreatedAt >= start && t.CreatedAt < end)
            .GroupBy(t => new { t.Type, t.Category })
            .Select(g => new { g.Key.Type, g.Key.Category, Total = g.Sum(t => t.Amount) })
            .ToListAsync(ct);

        var income = flows.Where(f => f.Type == TransactionType.Credit).Sum(f => f.Total);
        var expenses = flows.Where(f => f.Type == TransactionType.Debit).Sum(f => f.Total);

        var byCategory = flows
            .Where(f => f.Type == TransactionType.Debit)
            .GroupBy(f => f.Category)
            .Select(g => new CategoryTotal(g.Key, g.Sum(f => f.Total)))
            .OrderByDescending(c => c.Total)
            .ToList();

        return new DashboardSummary(y, m, account.Balance, income, expenses, byCategory);
    }
}

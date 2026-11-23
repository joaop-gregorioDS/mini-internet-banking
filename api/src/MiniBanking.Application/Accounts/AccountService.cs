using Microsoft.EntityFrameworkCore;
using MiniBanking.Application.Abstractions;
using MiniBanking.Application.Common;
using MiniBanking.Domain.Entities;

namespace MiniBanking.Application.Accounts;

public record AccountResponse(Guid AccountId, string OwnerName, decimal Balance);

public interface IAccountService
{
    Task<AccountResponse> GetMyAccountAsync(Guid userId, CancellationToken ct = default);
}

public class AccountService(IAppDbContext db) : IAccountService
{
    public async Task<AccountResponse> GetMyAccountAsync(Guid userId, CancellationToken ct = default)
    {
        var account = await db.Accounts
            .Include(a => a.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.UserId == userId, ct)
            ?? throw new NotFoundException("Conta não encontrada.");

        return new AccountResponse(account.Id, account.User!.Name, account.Balance);
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using MiniBanking.Domain.Entities;

namespace MiniBanking.Application.Abstractions;

/// <summary>Acesso aos dados usado pelos casos de uso. Implementado na Infrastructure.</summary>
public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Account> Accounts { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<Transaction> Transactions { get; }

    ChangeTracker ChangeTracker { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

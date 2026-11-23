using Microsoft.EntityFrameworkCore;
using MiniBanking.Domain.Entities;

namespace MiniBanking.Application.Abstractions;

/// <summary>Acesso aos dados usado pelos casos de uso. Implementado na Infrastructure.</summary>
public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Account> Accounts { get; }
    DbSet<RefreshToken> RefreshTokens { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

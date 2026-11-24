using Microsoft.EntityFrameworkCore;
using MiniBanking.Infrastructure.Persistence;

namespace MiniBanking.Infrastructure.Maintenance;

/// <summary>
/// Volta o banco ao estado de demonstração: apaga transferências, sessões e contas criadas pelos visitantes,
/// e restaura o saldo do usuário demo. O próprio usuário demo é mantido para o login "Entrar como Visitante".
/// </summary>
public static class DemoDataReset
{
    public static async Task ResetAsync(AppDbContext db, decimal demoBalance, CancellationToken ct = default)
    {
        // Ordem importa: lançamentos e sessões antes de contas e usuários.
        await db.Transactions.ExecuteDeleteAsync(ct);
        await db.RefreshTokens.ExecuteDeleteAsync(ct);

        // Remove os usuários não demo; as contas são apagadas em cascata pelo banco.
        await db.Users.Where(u => !u.IsDemo).ExecuteDeleteAsync(ct);

        await db.Accounts
            .Where(a => db.Users.Any(u => u.Id == a.UserId && u.IsDemo))
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.Balance, demoBalance), ct);
    }
}

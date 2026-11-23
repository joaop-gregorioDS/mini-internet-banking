using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using MiniBanking.Application.Abstractions;
using MiniBanking.Domain.Entities;

namespace MiniBanking.Infrastructure.Persistence;

/// <summary>
/// Cria (de forma idempotente) o usuário de demonstração usado pelo botão "Entrar como Visitante".
/// Dados fictícios. A senha é aleatória: o acesso demo só funciona pelo endpoint /api/auth/demo.
/// </summary>
public static class DemoDataSeeder
{
    public const string DemoEmail = "visitante@minibanking.dev";
    public const string DemoCpf = "52998224725"; // CPF fictício com dígitos verificadores válidos
    public const decimal DemoInitialBalance = 5000m;

    public static async Task SeedAsync(AppDbContext db, IPasswordService passwords, CancellationToken ct = default)
    {
        var exists = await db.Users.AnyAsync(u => u.Email == DemoEmail, ct);
        if (exists)
            return;

        var randomPassword = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var user = new User("Visitante Demo", DemoCpf, DemoEmail, passwords.Hash(randomPassword), isDemo: true);
        user.OpenAccount(DemoInitialBalance);

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);
    }
}

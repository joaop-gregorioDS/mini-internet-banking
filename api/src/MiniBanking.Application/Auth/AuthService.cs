using Microsoft.EntityFrameworkCore;
using MiniBanking.Application.Abstractions;
using MiniBanking.Application.Common;
using MiniBanking.Domain;
using MiniBanking.Domain.Entities;

namespace MiniBanking.Application.Auth;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<AuthResponse> RefreshAsync(RefreshRequest request, CancellationToken ct = default);
    Task<AuthResponse> LoginDemoAsync(CancellationToken ct = default);
}

public class AuthService(
    IAppDbContext db,
    IPasswordService passwords,
    ITokenService tokens,
    TimeProvider clock,
    JwtOptions options) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var cpf = CpfValidator.OnlyDigits(request.Cpf);

        var exists = await db.Users.AnyAsync(u => u.Email == email || u.Cpf == cpf, ct);
        if (exists)
            throw new ConflictException("Já existe um usuário com este e-mail ou CPF.");

        var user = new User(request.Name.Trim(), cpf, email, passwords.Hash(request.Password));
        user.OpenAccount(0m);

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        return await IssueTokensAsync(user, ct);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null || !passwords.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedException("E-mail ou senha inválidos.");

        return await IssueTokensAsync(user, ct);
    }

    public async Task<AuthResponse> RefreshAsync(RefreshRequest request, CancellationToken ct = default)
    {
        var hash = tokens.HashRefreshToken(request.RefreshToken);
        var now = clock.GetUtcNow().UtcDateTime;

        var stored = await db.RefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (stored is null || !stored.IsActive(now))
            throw new UnauthorizedException("Refresh token inválido ou expirado.");

        var user = await db.Users.FirstAsync(u => u.Id == stored.UserId, ct);

        // Rotação: o refresh token usado é revogado e um novo é emitido.
        stored.Revoke();
        await db.SaveChangesAsync(ct);

        return await IssueTokensAsync(user, ct);
    }

    public async Task<AuthResponse> LoginDemoAsync(CancellationToken ct = default)
    {
        var demo = await db.Users.FirstOrDefaultAsync(u => u.IsDemo, ct)
            ?? throw new UnauthorizedException("Usuário demo não disponível.");

        return await IssueTokensAsync(demo, ct);
    }

    private async Task<AuthResponse> IssueTokensAsync(User user, CancellationToken ct)
    {
        var (accessToken, accessExpires) = tokens.CreateAccessToken(user);

        var refreshPlain = tokens.CreateRefreshToken();
        var refreshExpires = clock.GetUtcNow().UtcDateTime.AddDays(options.RefreshTokenDays);
        db.RefreshTokens.Add(new RefreshToken(user.Id, tokens.HashRefreshToken(refreshPlain), refreshExpires));
        await db.SaveChangesAsync(ct);

        return new AuthResponse(
            accessToken,
            accessExpires,
            refreshPlain,
            refreshExpires,
            new UserInfo(user.Id, user.Name, user.Email, user.IsDemo));
    }
}

using MiniBanking.Domain.Entities;

namespace MiniBanking.Application.Abstractions;

public interface IPasswordService
{
    string Hash(string password);
    bool Verify(string password, string passwordHash);
}

public interface ITokenService
{
    /// <summary>Gera o access token JWT do usuário e a data de expiração (UTC).</summary>
    (string Token, DateTime ExpiresAt) CreateAccessToken(User user);

    /// <summary>Gera um refresh token aleatório em texto puro (retornado ao cliente uma única vez).</summary>
    string CreateRefreshToken();

    /// <summary>Hash determinístico do refresh token, usado para armazenar e buscar.</summary>
    string HashRefreshToken(string refreshToken);
}

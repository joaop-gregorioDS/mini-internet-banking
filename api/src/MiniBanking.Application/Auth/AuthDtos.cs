namespace MiniBanking.Application.Auth;

public record RegisterRequest(string Name, string Cpf, string Email, string Password);

public record LoginRequest(string Email, string Password);

public record RefreshRequest(string RefreshToken);

public record AuthResponse(
    string AccessToken,
    DateTime AccessTokenExpiresAt,
    string RefreshToken,
    DateTime RefreshTokenExpiresAt,
    UserInfo User);

public record UserInfo(Guid Id, string Name, string Email, bool IsDemo);

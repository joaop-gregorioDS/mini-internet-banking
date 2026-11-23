using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;
using MiniBanking.Application.Auth;

namespace MiniBanking.Api.Tests.Infrastructure;

public record AuthenticatedUser(HttpClient Client, AuthResponse Auth, string Cpf);

public static class TestHelpers
{
    /// <summary>Deserializa enums como texto ("Food"), igual ao contrato da API.</summary>
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    /// <summary>Gera um CPF com dígitos verificadores válidos, diferente a cada chamada.</summary>
    public static string NewCpf()
    {
        while (true)
        {
            var digits = Enumerable.Range(0, 9).Select(_ => RandomNumberGenerator.GetInt32(10)).ToArray();
            if (digits.Distinct().Count() == 1)
                continue;

            var first = CheckDigit(digits);
            var withFirst = digits.Append(first).ToArray();
            var second = CheckDigit(withFirst);
            return string.Concat(withFirst.Append(second));
        }
    }

    private static int CheckDigit(int[] digits)
    {
        // Pesos decrescentes a partir de (len + 1): 10..2 para o 1º dígito e 11..2 para o 2º.
        var weightStart = digits.Length + 1;
        var sum = 0;
        for (var i = 0; i < digits.Length; i++)
            sum += digits[i] * (weightStart - i);

        var remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    }

    /// <summary>Cria um usuário novo e retorna um cliente já autenticado com ele.</summary>
    public static async Task<AuthenticatedUser> RegisterAsync(ApiFixture fixture, string prefix = "user")
    {
        var cpf = NewCpf();
        var request = new RegisterRequest($"Usuário {prefix}", cpf, $"{prefix}-{Guid.NewGuid():N}@teste.dev", "Senha!Forte123");

        using var anonymous = fixture.CreateClient();
        var response = await anonymous.PostAsJsonAsync("/api/auth/register", request);
        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>(Json)
            ?? throw new InvalidOperationException("Resposta de registro vazia.");

        return new AuthenticatedUser(Authenticated(fixture, auth.AccessToken), auth, cpf);
    }

    /// <summary>Entra com o usuário demo (saldo inicial de R$ 5.000) e retorna um cliente autenticado.</summary>
    public static async Task<AuthenticatedUser> DemoAsync(ApiFixture fixture)
    {
        using var anonymous = fixture.CreateClient();
        var response = await anonymous.PostAsync("/api/auth/demo", null);
        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>(Json)
            ?? throw new InvalidOperationException("Resposta demo vazia.");

        return new AuthenticatedUser(Authenticated(fixture, auth.AccessToken), auth, string.Empty);
    }

    private static HttpClient Authenticated(ApiFixture fixture, string accessToken)
    {
        var client = fixture.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        return client;
    }

    public static async Task<decimal> BalanceAsync(HttpClient authenticated)
    {
        var account = await authenticated.GetFromJsonAsync<AccountDto>("/api/accounts/me", Json);
        return account!.Balance;
    }

    public static async Task<HttpResponseMessage> TransferAsync(
        HttpClient sender, string recipientCpf, decimal amount, string category = "Transfer", string description = "Teste")
    {
        var body = new { recipientCpf, amount, description, category };
        return await sender.PostAsJsonAsync("/api/transfers", body, Json);
    }

    private record AccountDto(Guid AccountId, string OwnerName, decimal Balance);
}

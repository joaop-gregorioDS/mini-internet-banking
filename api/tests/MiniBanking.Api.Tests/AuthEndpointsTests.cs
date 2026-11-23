using System.Net;
using System.Net.Http.Json;
using MiniBanking.Api.Tests.Infrastructure;
using MiniBanking.Application.Auth;
using Xunit;

namespace MiniBanking.Api.Tests;

[Collection(ApiCollection.Name)]
public class AuthEndpointsTests(ApiFixture fixture)
{
    // CPF fictício com dígitos verificadores válidos.
    private const string ValidCpf = "11144477735";

    private static RegisterRequest NewUser(string prefix) => new(
        Name: "Maria Teste",
        Cpf: ValidCpf,
        Email: $"{prefix}-{Guid.NewGuid():N}@teste.dev",
        Password: "Senha!Forte123");

    [Fact]
    public async Task Register_com_dados_validos_retorna_201_e_tokens()
    {
        using var client = fixture.CreateClient();
        // Cada teste usa um CPF diferente: o CPF é único no banco (e o demo usa 529.982.247-25).
        var request = NewUser("registro");

        var response = await client.PostAsJsonAsync("/api/auth/register", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(body.RefreshToken));
        Assert.Equal(request.Email.ToLowerInvariant(), body.User.Email);
        Assert.False(body.User.IsDemo);
    }

    [Fact]
    public async Task Register_com_cpf_invalido_retorna_400_com_erros()
    {
        using var client = fixture.CreateClient();
        var request = NewUser("cpf-invalido") with { Cpf = "12345678900" };

        var response = await client.PostAsJsonAsync("/api/auth/register", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadAsStringAsync();
        Assert.Contains("CPF inválido", problem);
    }

    [Fact]
    public async Task Register_com_email_duplicado_retorna_409()
    {
        using var client = fixture.CreateClient();
        var first = NewUser("duplicado") with { Cpf = "39053344705" };
        await client.PostAsJsonAsync("/api/auth/register", first);

        var second = first with { Cpf = "91234567873" };
        var response = await client.PostAsJsonAsync("/api/auth/register", second);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Login_com_senha_correta_retorna_200()
    {
        using var client = fixture.CreateClient();
        var user = NewUser("login-ok") with { Cpf = "71428793860" };
        await client.PostAsJsonAsync("/api/auth/register", user);

        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(user.Email, user.Password));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body.AccessToken));
    }

    [Fact]
    public async Task Login_com_senha_errada_retorna_401()
    {
        using var client = fixture.CreateClient();
        var user = NewUser("login-errado") with { Cpf = "86345678937" };
        await client.PostAsJsonAsync("/api/auth/register", user);

        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(user.Email, "outra-senha-123"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Refresh_rotaciona_o_token_e_reuso_do_antigo_retorna_401()
    {
        using var client = fixture.CreateClient();
        var user = NewUser("refresh") with { Cpf = "15350946056" };
        var registered = await (await client.PostAsJsonAsync("/api/auth/register", user))
            .Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(registered);

        var refreshed = await client.PostAsJsonAsync("/api/auth/refresh", new RefreshRequest(registered.RefreshToken));
        Assert.Equal(HttpStatusCode.OK, refreshed.StatusCode);
        var newPair = await refreshed.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(newPair);
        Assert.NotEqual(registered.RefreshToken, newPair.RefreshToken);

        var reuse = await client.PostAsJsonAsync("/api/auth/refresh", new RefreshRequest(registered.RefreshToken));
        Assert.Equal(HttpStatusCode.Unauthorized, reuse.StatusCode);
    }

    [Fact]
    public async Task Refresh_com_token_inexistente_retorna_401()
    {
        using var client = fixture.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/refresh", new RefreshRequest("token-que-nao-existe"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Demo_retorna_200_com_usuario_demo()
    {
        using var client = fixture.CreateClient();

        var response = await client.PostAsync("/api/auth/demo", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(body);
        Assert.True(body.User.IsDemo);
    }

    [Fact]
    public async Task Health_retorna_200()
    {
        using var client = fixture.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}

using Microsoft.AspNetCore.Mvc.Testing;
using Testcontainers.MsSql;

namespace MiniBanking.Api.Tests.Infrastructure;

/// <summary>Sobe um SQL Server 2022 real em Docker e uma API em memória apontando para ele.</summary>
public class ApiFixture : IAsyncLifetime
{
    private readonly MsSqlContainer _container = new MsSqlBuilder("mcr.microsoft.com/mssql/server:2022-CU14-ubuntu-22.04")
        .WithPassword("Teste!Integracao2026")
        .Build();

    public WebApplicationFactory<Program> Factory { get; private set; } = null!;

    public HttpClient CreateClient() => Factory.CreateClient();

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        var connectionString = _container.GetConnectionString();

        Factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("ConnectionStrings:Default", connectionString);
            builder.UseSetting("Jwt:Key", "chave-de-integracao-com-mais-de-32-caracteres");
        });
    }

    public async Task DisposeAsync()
    {
        await Factory.DisposeAsync();
        await _container.DisposeAsync();
    }
}

[CollectionDefinition(Name)]
public class ApiCollection : ICollectionFixture<ApiFixture>
{
    public const string Name = "api-integration";
}

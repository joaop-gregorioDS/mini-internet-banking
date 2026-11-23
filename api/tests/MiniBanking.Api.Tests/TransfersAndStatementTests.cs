using System.Net;
using System.Net.Http.Json;
using MiniBanking.Api.Tests.Infrastructure;
using MiniBanking.Application.Statement;
using MiniBanking.Domain.Entities;
using Xunit;

namespace MiniBanking.Api.Tests;

[Collection(ApiCollection.Name)]
public class TransfersAndStatementTests(ApiFixture fixture)
{
    [Fact]
    public async Task Transferencia_com_saldo_atualiza_os_dois_saldos_e_o_extrato()
    {
        var demo = await TestHelpers.DemoAsync(fixture);
        var recipient = await TestHelpers.RegisterAsync(fixture, "destino");

        var demoBefore = await TestHelpers.BalanceAsync(demo.Client);
        var recipientBefore = await TestHelpers.BalanceAsync(recipient.Client);

        var response = await TestHelpers.TransferAsync(demo.Client, recipient.Cpf, 120.50m, "Transfer", "Pagamento teste");

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal(demoBefore - 120.50m, await TestHelpers.BalanceAsync(demo.Client));
        Assert.Equal(recipientBefore + 120.50m, await TestHelpers.BalanceAsync(recipient.Client));

        var statement = await demo.Client.GetFromJsonAsync<PagedResult<TransactionItem>>(
            "/api/transactions?pageSize=1", TestHelpers.Json);
        var last = Assert.Single(statement!.Items);
        Assert.Equal(TransactionType.Debit, last.Type);
        Assert.Equal(120.50m, last.Amount);
        Assert.Equal("Pagamento teste", last.Description);
        Assert.Equal(recipient.Auth.User.Name, last.CounterpartyName);
    }

    [Fact]
    public async Task Transferencia_sem_saldo_retorna_422_e_nao_altera_nada()
    {
        var poor = await TestHelpers.RegisterAsync(fixture, "sem-saldo");
        var other = await TestHelpers.RegisterAsync(fixture, "outro");

        var response = await TestHelpers.TransferAsync(poor.Client, other.Cpf, 10m);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Contains("Saldo insuficiente", await response.Content.ReadAsStringAsync());
        Assert.Equal(0m, await TestHelpers.BalanceAsync(poor.Client));
        Assert.Equal(0m, await TestHelpers.BalanceAsync(other.Client));
    }

    [Fact]
    public async Task Transferencia_para_cpf_inexistente_retorna_404()
    {
        var demo = await TestHelpers.DemoAsync(fixture);
        var unknownCpf = TestHelpers.NewCpf();

        var response = await TestHelpers.TransferAsync(demo.Client, unknownCpf, 10m);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Contains("Destinatário não encontrado", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Transferencia_para_a_propria_conta_retorna_422()
    {
        var user = await TestHelpers.RegisterAsync(fixture, "self");

        var response = await TestHelpers.TransferAsync(user.Client, user.Cpf, 10m);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    [InlineData(10.123)]
    [InlineData(60000)]
    public async Task Transferencia_com_valor_invalido_retorna_400(decimal amount)
    {
        var demo = await TestHelpers.DemoAsync(fixture);
        var recipient = await TestHelpers.RegisterAsync(fixture, "valor-invalido");

        var response = await TestHelpers.TransferAsync(demo.Client, recipient.Cpf, amount);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Endpoints_protegidos_exigem_token()
    {
        using var anonymous = fixture.CreateClient();

        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/accounts/me")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/transactions")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await TestHelpers.TransferAsync(anonymous, TestHelpers.NewCpf(), 1m)).StatusCode);
    }

    [Fact]
    public async Task Extrato_pagina_e_filtra_por_categoria()
    {
        var demo = await TestHelpers.DemoAsync(fixture);
        var user = await TestHelpers.RegisterAsync(fixture, "extrato");
        await TestHelpers.TransferAsync(demo.Client, user.Cpf, 300m, "Income", "Salário");

        // 3 saídas em Food e 2 em Health para o usuário
        var sink = await TestHelpers.RegisterAsync(fixture, "receptor");
        for (var i = 0; i < 3; i++)
            Assert.Equal(HttpStatusCode.Created, (await TestHelpers.TransferAsync(user.Client, sink.Cpf, 10m, "Food", $"Mercado {i}")).StatusCode);
        for (var i = 0; i < 2; i++)
            Assert.Equal(HttpStatusCode.Created, (await TestHelpers.TransferAsync(user.Client, sink.Cpf, 10m, "Health", $"Farmácia {i}")).StatusCode);

        var food = await user.Client.GetFromJsonAsync<PagedResult<TransactionItem>>(
            "/api/transactions?category=Food&pageSize=2&page=1", TestHelpers.Json);
        Assert.NotNull(food);
        Assert.Equal(3, food.TotalCount);
        Assert.Equal(2, food.Items.Count);
        Assert.Equal(2, food.TotalPages);
        Assert.All(food.Items, item => Assert.Equal(TransactionCategory.Food, item.Category));

        var page2 = await user.Client.GetFromJsonAsync<PagedResult<TransactionItem>>(
            "/api/transactions?category=Food&pageSize=2&page=2", TestHelpers.Json);
        Assert.Single(page2!.Items);

        var all = await user.Client.GetFromJsonAsync<PagedResult<TransactionItem>>("/api/transactions", TestHelpers.Json);
        Assert.Equal(6, all!.TotalCount); // 1 crédito + 5 débitos
    }

    [Fact]
    public async Task Transferencias_simultaneas_nao_geram_saldo_negativo_nem_perdem_dinheiro()
    {
        // Concorrência: 10 transferências de R$ 50 ao mesmo tempo a partir de uma conta com R$ 500.
        var demo = await TestHelpers.DemoAsync(fixture);
        var sender = await TestHelpers.RegisterAsync(fixture, "concorrente");
        var recipient = await TestHelpers.RegisterAsync(fixture, "recebe");

        Assert.Equal(HttpStatusCode.Created, (await TestHelpers.TransferAsync(demo.Client, sender.Cpf, 500m)).StatusCode);
        var recipientBefore = await TestHelpers.BalanceAsync(recipient.Client);

        var responses = await Task.WhenAll(Enumerable.Range(0, 10).Select(_ =>
            TestHelpers.TransferAsync(sender.Client, recipient.Cpf, 50m)));

        Assert.All(responses, r => Assert.Equal(HttpStatusCode.Created, r.StatusCode));
        Assert.Equal(0m, await TestHelpers.BalanceAsync(sender.Client));
        Assert.Equal(recipientBefore + 500m, await TestHelpers.BalanceAsync(recipient.Client));
    }
}

using System.Net;
using System.Net.Http.Json;
using MiniBanking.Api.Tests.Infrastructure;
using MiniBanking.Application.Dashboard;
using MiniBanking.Domain.Entities;
using Xunit;

namespace MiniBanking.Api.Tests;

[Collection(ApiCollection.Name)]
public class DashboardTests(ApiFixture fixture)
{
    [Fact]
    public async Task Resumo_do_mes_soma_entradas_saidas_e_gastos_por_categoria()
    {
        var demo = await TestHelpers.DemoAsync(fixture);
        var user = await TestHelpers.RegisterAsync(fixture, "dashboard");
        var sink = await TestHelpers.RegisterAsync(fixture, "dashboard-destino");

        // Entrada de R$ 1.000 no mês atual (crédito vindo do demo).
        Assert.Equal(HttpStatusCode.Created, (await TestHelpers.TransferAsync(demo.Client, user.Cpf, 1000m, "Income", "Freela")).StatusCode);

        // Saídas: Food 100 + Food 25 + Health 50 = 175
        Assert.Equal(HttpStatusCode.Created, (await TestHelpers.TransferAsync(user.Client, sink.Cpf, 100m, "Food")).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await TestHelpers.TransferAsync(user.Client, sink.Cpf, 25m, "Food")).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await TestHelpers.TransferAsync(user.Client, sink.Cpf, 50m, "Health")).StatusCode);

        var summary = await user.Client.GetFromJsonAsync<DashboardSummary>("/api/dashboard/summary", TestHelpers.Json);

        Assert.NotNull(summary);
        Assert.Equal(825m, summary.Balance);
        Assert.Equal(1000m, summary.MonthIncome);
        Assert.Equal(175m, summary.MonthExpenses);

        Assert.Equal(2, summary.ExpensesByCategory.Count);
        // Ordenado do maior para o menor
        Assert.Equal(new CategoryTotal(TransactionCategory.Food, 125m), summary.ExpensesByCategory[0]);
        Assert.Equal(new CategoryTotal(TransactionCategory.Health, 50m), summary.ExpensesByCategory[1]);
    }

    [Fact]
    public async Task Mes_sem_movimentacao_retorna_zeros_e_mantem_o_saldo()
    {
        var demo = await TestHelpers.DemoAsync(fixture);

        var summary = await demo.Client.GetFromJsonAsync<DashboardSummary>(
            "/api/dashboard/summary?year=2000&month=1", TestHelpers.Json);

        Assert.NotNull(summary);
        Assert.Equal(0m, summary.MonthIncome);
        Assert.Equal(0m, summary.MonthExpenses);
        Assert.Empty(summary.ExpensesByCategory);
        Assert.Equal(await TestHelpers.BalanceAsync(demo.Client), summary.Balance);
    }

    [Fact]
    public async Task Mes_invalido_retorna_422()
    {
        var demo = await TestHelpers.DemoAsync(fixture);

        var response = await demo.Client.GetAsync("/api/dashboard/summary?year=2026&month=13");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }
}

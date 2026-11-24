using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MiniBanking.Api.Tests.Infrastructure;
using MiniBanking.Infrastructure.Maintenance;
using MiniBanking.Infrastructure.Persistence;
using Xunit;

namespace MiniBanking.Api.Tests;

public class DemoResetScheduleTests
{
    private static readonly TimeZoneInfo SaoPaulo = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");

    [Theory]
    [InlineData(2026, 11, 24, 2, 0, 24)]   // antes das 03h: roda no mesmo dia
    [InlineData(2026, 11, 24, 3, 0, 25)]   // exatamente 03h: já passou, roda amanhã
    [InlineData(2026, 11, 24, 15, 0, 25)]  // à tarde: roda na madrugada seguinte
    public void Proximo_reset_cai_as_3h_de_sao_paulo(int y, int mo, int d, int h, int min, int expectedDay)
    {
        var now = new DateTimeOffset(y, mo, d, h, min, 0, TimeSpan.FromHours(-3));

        var next = DemoResetBackgroundService.NextRunUtc(now.ToUniversalTime(), SaoPaulo, 3);

        // 03h em São Paulo (UTC-3, sem horário de verão) = 06h UTC.
        Assert.Equal(new DateTimeOffset(2026, 11, expectedDay, 6, 0, 0, TimeSpan.Zero), next);
    }
}

[Collection(ApiCollection.Name)]
public class DemoResetDataTests(ApiFixture fixture)
{
    [Fact]
    public async Task Reset_remove_visitantes_e_restaura_o_saldo_do_demo()
    {
        var demo = await TestHelpers.DemoAsync(fixture);
        var user = await TestHelpers.RegisterAsync(fixture, "reset");
        var sink = await TestHelpers.RegisterAsync(fixture, "reset-destino");

        Assert.Equal(HttpStatusCode.Created, (await TestHelpers.TransferAsync(demo.Client, user.Cpf, 300m, "Income")).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await TestHelpers.TransferAsync(user.Client, sink.Cpf, 100m, "Food")).StatusCode);

        using (var scope = fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await DemoDataReset.ResetAsync(db, 5000m);

            Assert.False(await db.Users.AnyAsync(u => u.Cpf == user.Cpf));
            Assert.False(await db.Users.AnyAsync(u => u.Cpf == sink.Cpf));
            Assert.Equal(0, await db.Transactions.CountAsync());
            Assert.Equal(0, await db.RefreshTokens.CountAsync());
            Assert.True(await db.Users.AnyAsync(u => u.IsDemo));
        }

        // O usuário demo continua existindo e volta com o saldo inicial.
        Assert.Equal(5000m, await TestHelpers.BalanceAsync(demo.Client));
    }
}

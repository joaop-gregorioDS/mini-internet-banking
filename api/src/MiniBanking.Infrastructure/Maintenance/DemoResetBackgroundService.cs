using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MiniBanking.Infrastructure.Persistence;

namespace MiniBanking.Infrastructure.Maintenance;

public class DemoResetOptions
{
    public const string SectionName = "DemoReset";

    public bool Enabled { get; set; } = true;

    /// <summary>Hora local (0-23) em que o reset roda todo dia.</summary>
    public int Hour { get; set; } = 3;

    /// <summary>Fuso do horário. "America/Sao_Paulo" é aceito em Linux e no Windows (.NET 8).</summary>
    public string TimeZoneId { get; set; } = "America/Sao_Paulo";
}

/// <summary>Executa <see cref="DemoDataReset"/> todo dia no horário configurado (padrão: 03h, São Paulo).</summary>
public class DemoResetBackgroundService(
    IServiceScopeFactory scopes,
    TimeProvider clock,
    IConfiguration configuration,
    ILogger<DemoResetBackgroundService> logger) : BackgroundService
{
    private const decimal DemoBalance = DemoDataSeeder.DemoInitialBalance;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var options = configuration.GetSection(DemoResetOptions.SectionName).Get<DemoResetOptions>() ?? new DemoResetOptions();
        if (!options.Enabled)
        {
            logger.LogInformation("Reset diário do modo demo desativado.");
            return;
        }

        TimeZoneInfo timeZone;
        try
        {
            timeZone = TimeZoneInfo.FindSystemTimeZoneById(options.TimeZoneId);
        }
        catch (TimeZoneNotFoundException ex)
        {
            // Erro de configuração não pode derrubar a API: o reset fica desativado e o erro fica no log.
            logger.LogError(ex, "Fuso '{TimeZone}' não encontrado. O reset diário não será executado.", options.TimeZoneId);
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            var nextRunUtc = NextRunUtc(clock.GetUtcNow(), timeZone, options.Hour);
            logger.LogInformation("Próximo reset do modo demo: {NextRun:u} (UTC).", nextRunUtc);

            await Task.Delay(nextRunUtc - clock.GetUtcNow(), clock, stoppingToken);

            try
            {
                using var scope = scopes.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                await DemoDataReset.ResetAsync(db, DemoBalance, stoppingToken);
                logger.LogInformation("Reset diário do modo demo concluído.");
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                // Não derruba a aplicação: tenta de novo na próxima janela.
                logger.LogError(ex, "Falha no reset diário do modo demo.");
            }
        }
    }

    /// <summary>Próximo instante (UTC) em que o relógio local marca <paramref name="hour"/>:00.</summary>
    public static DateTimeOffset NextRunUtc(DateTimeOffset nowUtc, TimeZoneInfo timeZone, int hour)
    {
        var local = TimeZoneInfo.ConvertTime(nowUtc, timeZone).DateTime;
        var candidate = local.Date.AddHours(hour);
        if (candidate <= local)
            candidate = candidate.AddDays(1);

        var utc = TimeZoneInfo.ConvertTimeToUtc(candidate, timeZone);
        return new DateTimeOffset(utc, TimeSpan.Zero);
    }
}

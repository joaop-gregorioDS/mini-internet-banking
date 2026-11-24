using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using MiniBanking.Application.Accounts;
using MiniBanking.Application.Auth;
using MiniBanking.Application.Dashboard;
using MiniBanking.Application.Statement;
using MiniBanking.Application.Transfers;

namespace MiniBanking.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ITransferService, TransferService>();
        services.AddScoped<IAccountService, AccountService>();
        services.AddScoped<IStatementService, StatementService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();
        return services;
    }
}

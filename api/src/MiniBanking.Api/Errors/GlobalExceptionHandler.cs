using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using MiniBanking.Application.Common;
using MiniBanking.Domain;

namespace MiniBanking.Api.Errors;

/// <summary>Converte exceções em respostas ProblemDetails (RFC 7807).</summary>
public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken ct)
    {
        var (status, title, detail, errors) = exception switch
        {
            ValidationException ve => (
                StatusCodes.Status400BadRequest,
                "Dados inválidos",
                "Um ou mais campos não passaram na validação.",
                (object?)ve.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray())),
            UnauthorizedException ue => (StatusCodes.Status401Unauthorized, "Não autorizado", ue.Message, null),
            ConflictException ce => (StatusCodes.Status409Conflict, "Conflito", ce.Message, null),
            DomainException de => (StatusCodes.Status422UnprocessableEntity, "Regra de negócio", de.Message, null),
            _ => (StatusCodes.Status500InternalServerError, "Erro interno", "Ocorreu um erro inesperado.", null)
        };

        if (status == StatusCodes.Status500InternalServerError)
            logger.LogError(exception, "Erro não tratado em {Path}", context.Request.Path);

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path
        };

        if (errors is not null)
            problem.Extensions["errors"] = errors;

        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(problem, ct);
        return true;
    }
}

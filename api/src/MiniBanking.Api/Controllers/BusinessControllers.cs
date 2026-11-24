using System.Security.Claims;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniBanking.Application.Accounts;
using MiniBanking.Application.Common;
using MiniBanking.Application.Dashboard;
using MiniBanking.Application.Statement;
using MiniBanking.Application.Transfers;
using MiniBanking.Domain.Entities;

namespace MiniBanking.Api.Controllers;

/// <summary>Identificador do usuário logado, lido do claim "sub" do JWT.</summary>
public static class ClaimsExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue("sub") ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out var id) ? id : throw new UnauthorizedException("Token sem usuário válido.");
    }
}

[ApiController]
[Authorize]
[Route("api/accounts")]
public class AccountsController(IAccountService accounts) : ControllerBase
{
    [HttpGet("me")]
    [ProducesResponseType(typeof(AccountResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AccountResponse>> GetMine(CancellationToken ct) =>
        Ok(await accounts.GetMyAccountAsync(User.GetUserId(), ct));
}

[ApiController]
[Authorize]
[Route("api/transfers")]
public class TransfersController(ITransferService transfers, IServiceProvider services) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(TransferResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<TransferResponse>> Create(TransferRequest request, CancellationToken ct)
    {
        var validator = services.GetRequiredService<IValidator<TransferRequest>>();
        var result = await validator.ValidateAsync(request, ct);
        if (!result.IsValid)
            throw new ValidationException(result.Errors);

        var response = await transfers.TransferAsync(User.GetUserId(), request, ct);
        return Created($"/api/transactions/{response.TransactionId}", response);
    }
}

[ApiController]
[Authorize]
[Route("api/dashboard")]
public class DashboardController(IDashboardService dashboard) : ControllerBase
{
    [HttpGet("summary")]
    [ProducesResponseType(typeof(DashboardSummary), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardSummary>> Summary(
        [FromQuery] int? year,
        [FromQuery] int? month,
        CancellationToken ct) =>
        Ok(await dashboard.GetSummaryAsync(User.GetUserId(), year, month, ct));
}

[ApiController]
[Authorize]
[Route("api/transactions")]
public class TransactionsController(IStatementService statement) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<TransactionItem>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<TransactionItem>>> List(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] TransactionCategory? category,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var query = new StatementQuery(from, to, category, page, pageSize);
        return Ok(await statement.GetAsync(User.GetUserId(), query, ct));
    }
}

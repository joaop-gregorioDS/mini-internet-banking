using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using MiniBanking.Application.Auth;

namespace MiniBanking.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService auth, IServiceProvider services) : ControllerBase
{
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken ct)
    {
        await ValidateAsync(request, ct);
        var response = await auth.RegisterAsync(request, ct);
        return Created("/api/accounts/me", response);
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken ct)
    {
        await ValidateAsync(request, ct);
        return Ok(await auth.LoginAsync(request, ct));
    }

    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest request, CancellationToken ct)
    {
        await ValidateAsync(request, ct);
        return Ok(await auth.RefreshAsync(request, ct));
    }

    [HttpPost("demo")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthResponse>> Demo(CancellationToken ct)
    {
        return Ok(await auth.LoginDemoAsync(ct));
    }

    private async Task ValidateAsync<T>(T request, CancellationToken ct)
    {
        var validator = services.GetService<IValidator<T>>();
        if (validator is null)
            return;

        var result = await validator.ValidateAsync(request, ct);
        if (!result.IsValid)
            throw new ValidationException(result.Errors);
    }
}

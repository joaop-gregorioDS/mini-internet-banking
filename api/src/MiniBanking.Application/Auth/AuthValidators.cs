using FluentValidation;
using MiniBanking.Domain;

namespace MiniBanking.Application.Auth;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Informe o nome.")
            .MaximumLength(120);

        RuleFor(x => x.Cpf)
            .Must(CpfValidator.IsValid).WithMessage("CPF inválido.");

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress().WithMessage("E-mail inválido.")
            .MaximumLength(160);

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8).WithMessage("A senha deve ter pelo menos 8 caracteres.")
            .MaximumLength(100);
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class RefreshRequestValidator : AbstractValidator<RefreshRequest>
{
    public RefreshRequestValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}

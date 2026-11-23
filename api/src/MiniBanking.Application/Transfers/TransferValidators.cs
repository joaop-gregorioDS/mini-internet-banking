using FluentValidation;
using MiniBanking.Domain;
using MiniBanking.Domain.Entities;

namespace MiniBanking.Application.Transfers;

public class TransferRequestValidator : AbstractValidator<TransferRequest>
{
    public const decimal MaxAmountPerTransfer = 50_000m;

    public TransferRequestValidator()
    {
        RuleFor(x => x.RecipientCpf)
            .Must(CpfValidator.IsValid).WithMessage("CPF do destinatário inválido.");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("O valor deve ser maior que zero.")
            .LessThanOrEqualTo(MaxAmountPerTransfer).WithMessage($"O valor máximo por transferência é R$ {MaxAmountPerTransfer:N2}.")
            .PrecisionScale(18, 2, ignoreTrailingZeros: true).WithMessage("O valor deve ter no máximo 2 casas decimais.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Informe uma descrição.")
            .MaximumLength(140);

        RuleFor(x => x.Category)
            .IsInEnum().WithMessage("Categoria inválida.");
    }
}

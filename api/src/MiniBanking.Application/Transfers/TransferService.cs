using FluentValidation;
using Microsoft.EntityFrameworkCore;
using MiniBanking.Application.Abstractions;
using MiniBanking.Application.Common;
using MiniBanking.Domain;
using MiniBanking.Domain.Entities;

namespace MiniBanking.Application.Transfers;

public record TransferRequest(string RecipientCpf, decimal Amount, string Description, TransactionCategory Category);

public record TransferResponse(Guid TransactionId, string RecipientName, decimal Amount, decimal NewBalance);

public interface ITransferService
{
    Task<TransferResponse> TransferAsync(Guid senderUserId, TransferRequest request, CancellationToken ct = default);
}

public class TransferService(IAppDbContext db) : ITransferService
{
    private const int MaxAttempts = 10;

    public async Task<TransferResponse> TransferAsync(Guid senderUserId, TransferRequest request, CancellationToken ct = default)
    {
        var recipientCpf = CpfValidator.OnlyDigits(request.RecipientCpf);
        var description = request.Description.Trim();

        for (var attempt = 1; ; attempt++)
        {
            try
            {
                return await ExecuteOnceAsync(senderUserId, recipientCpf, request.Amount, description, request.Category, ct);
            }
            catch (DbUpdateConcurrencyException) when (attempt < MaxAttempts)
            {
                // Outra transferência alterou uma das contas ao mesmo tempo: recarrega e tenta de novo.
                db.ChangeTracker.Clear();
                await Task.Delay(Random.Shared.Next(5, 25) * attempt, ct);
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new ConflictException("Não foi possível concluir a transferência agora. Tente novamente.");
            }
        }
    }

    private async Task<TransferResponse> ExecuteOnceAsync(
        Guid senderUserId, string recipientCpf, decimal amount, string description,
        TransactionCategory category, CancellationToken ct)
    {
        var sender = await db.Accounts
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.UserId == senderUserId, ct)
            ?? throw new NotFoundException("Conta do remetente não encontrada.");

        var recipient = await db.Accounts
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.User!.Cpf == recipientCpf, ct)
            ?? throw new NotFoundException("Destinatário não encontrado. Confira o CPF informado.");

        if (recipient.Id == sender.Id)
            throw new DomainException("Não é possível transferir para a própria conta.");

        // Débito, crédito e lançamentos são gravados em um único SaveChanges (transação atômica).
        sender.Debit(amount);
        recipient.Credit(amount);

        var senderName = sender.User!.Name;
        var recipientName = recipient.User!.Name;

        var debit = Transaction.Debit(sender.Id, amount, category, description, recipientName, recipient.Id);
        db.Transactions.Add(debit);
        db.Transactions.Add(Transaction.Credit(recipient.Id, amount, category, description, senderName, sender.Id));

        await db.SaveChangesAsync(ct);

        return new TransferResponse(debit.Id, recipientName, amount, sender.Balance);
    }
}

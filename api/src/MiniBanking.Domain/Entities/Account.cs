namespace MiniBanking.Domain.Entities;

public class Account
{
    private Account() { }

    public Account(Guid userId, decimal initialBalance = 0m)
    {
        if (initialBalance < 0)
            throw new DomainException("O saldo inicial não pode ser negativo.");

        Id = Guid.NewGuid();
        UserId = userId;
        Balance = initialBalance;
    }

    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }

    /// <summary>Saldo em reais. Sempre decimal, nunca float.</summary>
    public decimal Balance { get; private set; }

    /// <summary>Controle de concorrência otimista (mapeado como rowversion no SQL Server).</summary>
    public byte[] RowVersion { get; private set; } = [];

    public User? User { get; private set; }

    public void Credit(decimal amount)
    {
        if (amount <= 0)
            throw new DomainException("O valor deve ser maior que zero.");

        Balance += amount;
    }

    public void Debit(decimal amount)
    {
        if (amount <= 0)
            throw new DomainException("O valor deve ser maior que zero.");

        if (amount > Balance)
            throw new DomainException("Saldo insuficiente para concluir a operação.");

        Balance -= amount;
    }
}

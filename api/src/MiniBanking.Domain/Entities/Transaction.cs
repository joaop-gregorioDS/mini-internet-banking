namespace MiniBanking.Domain.Entities;

public enum TransactionType
{
    Credit = 1,
    Debit = 2
}

public enum TransactionCategory
{
    Income = 1,
    Housing = 2,
    Food = 3,
    Health = 4,
    Transport = 5,
    Leisure = 6,
    Education = 7,
    Transfer = 8,
    Other = 99
}

/// <summary>Lançamento no extrato. Cada transferência gera um Debit (remetente) e um Credit (destinatário).</summary>
public class Transaction
{
    private Transaction() { }

    private Transaction(
        Guid accountId,
        TransactionType type,
        decimal amount,
        TransactionCategory category,
        string description,
        string counterpartyName,
        Guid? counterpartyAccountId)
    {
        Id = Guid.NewGuid();
        AccountId = accountId;
        Type = type;
        Amount = amount;
        Category = category;
        Description = description;
        CounterpartyName = counterpartyName;
        CounterpartyAccountId = counterpartyAccountId;
        CreatedAt = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid AccountId { get; private set; }
    public TransactionType Type { get; private set; }
    public decimal Amount { get; private set; }
    public TransactionCategory Category { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public string CounterpartyName { get; private set; } = string.Empty;
    public Guid? CounterpartyAccountId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public static Transaction Debit(Guid accountId, decimal amount, TransactionCategory category,
        string description, string counterpartyName, Guid counterpartyAccountId) =>
        new(accountId, TransactionType.Debit, amount, category, description, counterpartyName, counterpartyAccountId);

    public static Transaction Credit(Guid accountId, decimal amount, TransactionCategory category,
        string description, string counterpartyName, Guid counterpartyAccountId) =>
        new(accountId, TransactionType.Credit, amount, category, description, counterpartyName, counterpartyAccountId);
}

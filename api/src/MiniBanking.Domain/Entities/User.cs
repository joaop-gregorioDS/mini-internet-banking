namespace MiniBanking.Domain.Entities;

public class User
{
    private User() { }

    public User(string name, string cpf, string email, string passwordHash, bool isDemo = false)
    {
        Id = Guid.NewGuid();
        Name = name;
        Cpf = cpf;
        Email = email.Trim().ToLowerInvariant();
        PasswordHash = passwordHash;
        IsDemo = isDemo;
        CreatedAt = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;

    /// <summary>CPF somente com dígitos (11 caracteres).</summary>
    public string Cpf { get; private set; } = string.Empty;

    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public bool IsDemo { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public Account? Account { get; private set; }

    public void ChangePasswordHash(string passwordHash) => PasswordHash = passwordHash;

    public Account OpenAccount(decimal initialBalance = 0m)
    {
        if (Account is not null)
            throw new DomainException("O usuário já possui uma conta.");

        Account = new Account(Id, initialBalance);
        return Account;
    }
}

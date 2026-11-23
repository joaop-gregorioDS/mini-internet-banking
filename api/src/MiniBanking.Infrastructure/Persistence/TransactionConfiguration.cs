using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MiniBanking.Domain.Entities;

namespace MiniBanking.Infrastructure.Persistence;

public class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.ToTable("Transactions");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(t => t.Type).HasConversion<string>().HasMaxLength(10);
        builder.Property(t => t.Category).HasConversion<string>().HasMaxLength(20);
        builder.Property(t => t.Description).HasMaxLength(140).IsRequired();
        builder.Property(t => t.CounterpartyName).HasMaxLength(120).IsRequired();

        // Extrato: lista de uma conta ordenada por data.
        builder.HasIndex(t => new { t.AccountId, t.CreatedAt });
    }
}

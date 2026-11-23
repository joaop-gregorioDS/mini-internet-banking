using MiniBanking.Domain;
using MiniBanking.Domain.Entities;
using Xunit;

namespace MiniBanking.Application.Tests;

public class CpfValidatorTests
{
    [Theory]
    [InlineData("11144477735")]
    [InlineData("529.982.247-25")]
    public void CPF_valido_e_aceito(string cpf) =>
        Assert.True(CpfValidator.IsValid(cpf));

    [Theory]
    [InlineData("12345678900")]
    [InlineData("00000000000")]
    [InlineData("111.111.111-11")]
    [InlineData("1234")]
    [InlineData("")]
    public void CPF_invalido_e_rejeitado(string cpf) =>
        Assert.False(CpfValidator.IsValid(cpf));
}

public class AccountTests
{
    [Fact]
    public void Debit_com_saldo_insuficiente_lanca_DomainException()
    {
        var account = new Account(Guid.NewGuid(), 100m);

        var ex = Assert.Throws<DomainException>(() => account.Debit(150m));

        Assert.Contains("Saldo insuficiente", ex.Message);
        Assert.Equal(100m, account.Balance);
    }

    [Fact]
    public void Debit_e_Credit_atualizam_o_saldo()
    {
        var account = new Account(Guid.NewGuid(), 100m);

        account.Debit(30m);
        account.Credit(10m);

        Assert.Equal(80m, account.Balance);
    }

    [Fact]
    public void Valor_zero_ou_negativo_nao_e_aceito()
    {
        var account = new Account(Guid.NewGuid(), 100m);

        Assert.Throws<DomainException>(() => account.Debit(0m));
        Assert.Throws<DomainException>(() => account.Credit(-5m));
    }
}

public class RefreshTokenTests
{
    [Fact]
    public void Token_revogado_ou_expirado_nao_esta_ativo()
    {
        var now = DateTime.UtcNow;
        var token = new RefreshToken(Guid.NewGuid(), "hash", now.AddMinutes(10));

        Assert.True(token.IsActive(now));

        token.Revoke();
        Assert.False(token.IsActive(now));

        var expired = new RefreshToken(Guid.NewGuid(), "hash2", now.AddMinutes(-1));
        Assert.False(expired.IsActive(now));
    }
}

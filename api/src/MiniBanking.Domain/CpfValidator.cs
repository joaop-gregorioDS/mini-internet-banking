namespace MiniBanking.Domain;

/// <summary>Validação de CPF pelos dígitos verificadores (sem consulta externa).</summary>
public static class CpfValidator
{
    public static string OnlyDigits(string value) =>
        new string(value.Where(char.IsDigit).ToArray());

    public static bool IsValid(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        var cpf = OnlyDigits(value);
        if (cpf.Length != 11 || cpf.Distinct().Count() == 1)
            return false;

        return CheckDigit(cpf, 9) == cpf[9] - '0' && CheckDigit(cpf, 10) == cpf[10] - '0';
    }

    private static int CheckDigit(string cpf, int length)
    {
        var sum = 0;
        for (var i = 0; i < length; i++)
            sum += (cpf[i] - '0') * (length + 1 - i);

        var remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    }
}

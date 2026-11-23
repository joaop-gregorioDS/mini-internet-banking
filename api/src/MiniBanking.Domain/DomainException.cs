namespace MiniBanking.Domain;

/// <summary>Violação de regra de negócio. A API traduz para 422 (ProblemDetails).</summary>
public class DomainException(string message) : Exception(message);

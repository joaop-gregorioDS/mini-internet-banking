namespace MiniBanking.Application.Common;

/// <summary>Credenciais inválidas ou token inválido/expirado. A API responde 401.</summary>
public class UnauthorizedException(string message) : Exception(message);

/// <summary>Recurso já existe (ex.: e-mail ou CPF duplicado). A API responde 409.</summary>
public class ConflictException(string message) : Exception(message);

/// <summary>Recurso não encontrado (ex.: destinatário inexistente). A API responde 404.</summary>
public class NotFoundException(string message) : Exception(message);

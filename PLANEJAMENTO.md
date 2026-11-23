# 01 — Mini Internet Banking / Sistema de Gestão Financeira

> Projeto de portfólio com **dados fictícios**. Não é uma instituição financeira e não movimenta dinheiro real.

## 1. Objetivo

Mostrar domínio de Angular moderno (signals, formulários reativos, guards, interceptors) e de um back-end corporativo em .NET 8, com autenticação JWT, regras de negócio em transações e deploy próprio na VPS.

O que o recrutador deve conseguir fazer em 2 minutos:

1. Clicar em **"Entrar como Visitante"** e cair no painel.
2. Ver saldo e extrato, com filtros por data e categoria.
3. Fazer uma transferência simulada para outro usuário demo (com validação de saldo).
4. Ver o gráfico de gastos por categoria.
5. Abrir o Swagger da API e testar os endpoints com o botão Authorize.

## 2. Escopo

**Dentro do escopo (MVP)**

- Cadastro e login (JWT + refresh token).
- Usuário demo com seed automático.
- Contas: visualizar saldo e dados da conta (uma conta corrente por usuário no MVP).
- Transferência entre usuários cadastrados (valor, destinatário por CPF, descrição, categoria).
- Extrato com paginação, filtro por período e por categoria.
- Painel com saldo, total de entradas/saídas do mês e gráfico de gastos por categoria.
- Testes unitários nos serviços principais (front e back) e testes de integração da API.

**Fora do escopo (por enquanto)**

- Pagamentos de boleto, PIX real, cartões, investimentos.
- Múltiplas contas por usuário e moedas diferentes.
- Integração com provedores bancários reais.

## 3. Stack

Mesma base do projeto `envelhecer-bem`, para reaproveitar padrões já validados:

| Camada | Tecnologia |
|---|---|
| Front-end | Angular 22 (standalone, signals, Reactive Forms, `HttpInterceptorFn`, functional guards), Vitest |
| Back-end | .NET 8 Web API, EF Core, JWT Bearer, FluentValidation, ProblemDetails (RFC 7807) |
| Banco | SQL Server 2022 (projeto "core corporativo" da estratégia de bancos) |
| Testes API | xUnit + `WebApplicationFactory` |
| Infra | Docker Compose, Nginx (front), proxy reverso + SSL na VPS |

## 4. Arquitetura

### API (.NET 8)

```
api/
  src/
    MiniBanking.Api/              # Controllers ou Minimal APIs, Program.cs, middlewares
    MiniBanking.Application/      # Casos de uso, DTOs, validadores (FluentValidation)
    MiniBanking.Domain/           # Entidades (Account, Transaction, User), regras de negócio
    MiniBanking.Infrastructure/   # EF Core DbContext, migrations, repositórios, seeder
  tests/
    MiniBanking.Api.Tests/        # Integração (WebApplicationFactory)
    MiniBanking.Application.Tests/# Unitários das regras de transferência
```

Pontos de engenharia a destacar:

- **Transferência atômica:** débito, crédito e lançamentos no extrato dentro de uma única transação EF Core, com checagem de saldo e tratamento de concorrência (`RowVersion` na conta).
- **Erros padronizados:** `IExceptionHandler` retornando ProblemDetails.
- **Migrations automáticas** na inicialização + **seeder idempotente** (usuário demo e dados de exemplo).
- **Resiliência:** `EnableRetryOnFailure()` e `healthcheck` no compose.
- **Swagger** habilitado também na VPS, com autenticação JWT.

### Front-end (Angular 22)

```
web/src/app/
  core/
    auth/                 # AuthService (signals), guard funcional, login
    http/                 # interceptor JWT + refresh silencioso em 401, tratamento global de erro
  features/
    dashboard/            # Smart component: saldo, resumo do mês, gráfico
    transfer/             # Smart component: formulário reativo com validações customizadas
    statement/            # Smart component: extrato com filtros e paginação
  shared/
    components/           # Dumb components: card de saldo, tabela, badge de status, modal
    validators/           # CPF, máscara de moeda, saldo suficiente (validador de grupo)
```

Pontos de front-end a destacar:

- **Reactive Forms com validação customizada:** CPF válido, máscara de moeda, valor não pode exceder o saldo (validador no nível do formulário).
- **Lazy loading** das features.
- **Signals** para estado de sessão e de filtros do extrato.
- **Interceptor JWT** injeta o `Authorization: Bearer` e renova o token em 401; erros viram toast.
- **Guards funcionais** para rotas autenticadas.

## 5. Modelo de dados (MVP)

| Tabela | Campos principais |
|---|---|
| `Users` | Id, Name, Cpf (único), Email (único), PasswordHash, IsDemo |
| `Accounts` | Id, UserId (1:1), Balance (decimal 18,2), RowVersion |
| `Transactions` | Id, AccountId, Type (Credit/Debit), Amount, Category, Description, CreatedAt, CounterpartyAccountId |
| `RefreshTokens` | Id, UserId, TokenHash, ExpiresAt, RevokedAt |

Valores monetários sempre em `decimal`, nunca em `float`.

## 6. Endpoints previstos

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cadastro |
| POST | `/api/auth/login` | Login (retorna access + refresh) |
| POST | `/api/auth/refresh` | Renova o access token |
| POST | `/api/auth/demo` | Entra com o usuário demo |
| GET | `/api/accounts/me` | Dados e saldo da conta do usuário logado |
| POST | `/api/transfers` | Transferência (valida saldo e destinatário) |
| GET | `/api/transactions` | Extrato (filtros: `from`, `to`, `category`, `page`, `pageSize`) |
| GET | `/api/dashboard/summary` | Saldo, entradas/saídas do mês, gastos por categoria |

## 7. Fases de construção

Cada fase termina com commit próprio e algo testável.

| Fase | Entrega | Critério de pronto |
|---|---|---|
| 0. Setup | Pastas, solução .NET, projeto Angular, Docker Compose com SQL Server | `docker compose up` sobe banco, API e front |
| 1. Domínio e auth | Entidades, DbContext, migrations, register/login/refresh | Testes de integração de auth passando |
| 2. Transferências | Conta, transferência atômica, extrato paginado | Testes de saldo insuficiente, destinatário inexistente e concorrência |
| 3. Dashboard API | Endpoint de resumo e gastos por categoria | Teste de agregação do mês |
| 4. Front: shell e auth | Login, registro, login demo, guard, interceptor | Fluxo de login e 401 com refresh testado |
| 5. Front: telas | Dashboard, transferência, extrato com filtros | Formulários com validação customizada testados |
| 6. Qualidade | Testes unitários do front, lint/prettier, README com prints | Build de produção sem erros |
| 7. GitHub | Repositório próprio, CI simples (build + testes) | Actions verde no `main` |
| 8. VPS | Deploy com Nginx proxy reverso, SSL, logs rotacionados, seed às 03h | URL pública funcionando com login demo |

## 8. Decisões que preciso que você confirme

1. **Idioma da interface e do código:** sugiro UI em português e código (nomes de classes e métodos) em inglês, como no `envelhecer-bem`.
2. **Banco:** SQL Server 2022 (recomendado para o "projeto core" do currículo) ou PostgreSQL para ficar mais leve na VPS?
3. **Gráficos:** biblioteca pronta (ex.: Chart.js via `ng2-charts`) ou gráfico simples em SVG feito à mão?
4. **Transferência:** apenas entre usuários cadastrados no sistema (sugestão, sem risco) ou também com destinatário "externo" simulado?
5. **Nome do repositório no GitHub:** `mini-internet-banking`?

## 9. Riscos e cuidados

- **Segurança:** segredos (JWT key, senha do SQL) só via `.env` no servidor, nunca commitados. Porta do banco fechada para a internet.
- **Dados fictícios:** deixar claro na UI e no README que é simulação.
- **Reset diário:** o seed das 03h limpa transferências feitas por visitantes, para o sistema não ficar sujo.
- **Memória na VPS:** `mem_limit` no SQL Server (2 GB) e logs do Docker com `max-size: 10m`.

## 10. Próximo passo

Confirmar as decisões da seção 8 (ou aceitar os padrões sugeridos). Depois começo pela **Fase 0**: criar a solução .NET e o projeto Angular dentro de `01-mini-internet-banking/`.

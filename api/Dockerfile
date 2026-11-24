FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src
COPY MiniBanking.sln ./
COPY src/ ./src/
COPY tests/ ./tests/
RUN dotnet restore MiniBanking.sln
RUN dotnet publish src/MiniBanking.Api/MiniBanking.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app
# tzdata: o reset diário usa o fuso America/Sao_Paulo (sem ele, TimeZoneInfo não encontra o fuso).
RUN apk add --no-cache icu-libs tzdata \
    && adduser -D -u 10001 appuser
COPY --from=build /app/publish .
USER appuser
# Alpine não tem ICU por padrão: sem ele o SqlClient falha com "en-us is an invalid culture".
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "MiniBanking.Api.dll"]

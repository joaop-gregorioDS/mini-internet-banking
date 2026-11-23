FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src
COPY MiniBanking.sln ./
COPY src/ ./src/
COPY tests/ ./tests/
RUN dotnet restore MiniBanking.sln
RUN dotnet publish src/MiniBanking.Api/MiniBanking.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app
RUN adduser -D -u 10001 appuser
COPY --from=build /app/publish .
USER appuser
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "MiniBanking.Api.dll"]

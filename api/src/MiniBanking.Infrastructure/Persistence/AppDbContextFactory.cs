using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MiniBanking.Infrastructure.Persistence;

/// <summary>Usado apenas pelo dotnet-ef para gerar migrations (sem subir a API).</summary>
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer("Server=localhost,1433;Database=MiniBanking;User Id=sa;Password=DesignTime!Only1;TrustServerCertificate=True")
            .Options;

        return new AppDbContext(options);
    }
}

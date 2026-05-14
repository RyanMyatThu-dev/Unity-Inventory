using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Unity_Inventory.Database.IMSDbContextModels;

namespace Unity_Inventory.Seeder;

internal static class Program
{
    public static async Task<int> Main(string[] args)
    {
        var force = args.Any(a => string.Equals(a, "--force", StringComparison.OrdinalIgnoreCase));
        if (!force)
        {
            Console.WriteLine("This tool drops and recreates the entire database from the EF model, then inserts demo users, one business, and role-based permissions (UserId is always null on permissions).");
            Console.WriteLine();
            Console.WriteLine("Run: dotnet run --project Unity_Inventory.Seeder -- --force");
            Console.WriteLine();
            Console.WriteLine("Connection: appsettings.json ConnectionStrings:DefaultConnection, or env ConnectionStrings__DefaultConnection.");
            return 1;
        }

        var configuration = new ConfigurationBuilder()
            .SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile("appsettings.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection")
                               ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            Console.Error.WriteLine("Missing connection string (appsettings.json or ConnectionStrings__DefaultConnection).");
            return 1;
        }

        var options = new DbContextOptionsBuilder<IMSDbContext>()
            .UseSqlServer(connectionString)
            .Options;

        await using var db = new IMSDbContext(options);

        Console.WriteLine("EnsureDeleted…");
        await db.Database.EnsureDeletedAsync();

        Console.WriteLine("EnsureCreated (applies current EF model)…");
        await db.Database.EnsureCreatedAsync();

        // Passwords satisfy domain UserService rules: length >= 6, upper, lower, digit.
        var owner = new TblUser
        {
            Name = "Demo Owner",
            Email = "owner@demo.local",
            Username = "owner",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Owner123"),
            AccountType = "Owner",
            CreatedAt = DateTime.UtcNow,
            DeleteFlag = false,
        };
        var admin = new TblUser
        {
            Name = "Demo Admin",
            Email = "admin@demo.local",
            Username = "admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123"),
            AccountType = "Admin",
            CreatedAt = DateTime.UtcNow,
            DeleteFlag = false,
        };
        var staff = new TblUser
        {
            Name = "Demo Staff",
            Email = "staff@demo.local",
            Username = "staff",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Staff123"),
            AccountType = "Staff",
            CreatedAt = DateTime.UtcNow,
            DeleteFlag = false,
        };

        db.TblUsers.Add(owner);
        await db.SaveChangesAsync();

        db.TblUsers.Add(admin);
        db.TblUsers.Add(staff);
        await db.SaveChangesAsync();

        var business = new TblBusiness
        {
            BusinessName = "Demo Business",
            SubscriptionTier = "Free",
            OwnerId = owner.UserId,
        };
        db.TblBusinesses.Add(business);
        await db.SaveChangesAsync();

        db.TblUserBusinesses.Add(new TblUserBusiness { UserId = owner.UserId, BusinessId = business.BusinessId, Role = "Owner" });
        db.TblUserBusinesses.Add(new TblUserBusiness { UserId = admin.UserId, BusinessId = business.BusinessId, Role = "Admin" });
        db.TblUserBusinesses.Add(new TblUserBusiness { UserId = staff.UserId, BusinessId = business.BusinessId, Role = "Staff" });
        await db.SaveChangesAsync();

        var permissions = RolePermissionSeedData.BuildForBusiness(business.BusinessId, owner.UserId);
        db.TblRolePermissions.AddRange(permissions);
        await db.SaveChangesAsync();

        Console.WriteLine();
        Console.WriteLine("Seed complete.");
        Console.WriteLine($"  Business: {business.BusinessName} (Id={business.BusinessId})");
        Console.WriteLine("  Accounts (same pattern: capital letter + rest + 123):");
        Console.WriteLine("    owner@demo.local  / Owner123   — role Owner");
        Console.WriteLine("    admin@demo.local  / Admin123   — role Admin");
        Console.WriteLine("    staff@demo.local  / Staff123   — role Staff");
        Console.WriteLine($"  Role permissions: {permissions.Count} rows (UserId null; Owner full CRUD per module, Admin minus users/business delete, Staff read + sales create).");
        return 0;
    }
}

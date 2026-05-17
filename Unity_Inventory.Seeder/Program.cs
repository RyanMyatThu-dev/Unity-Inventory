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

        Console.WriteLine("Generating presentation demo data...");
        await SeedDemoDataAsync(db, business.BusinessId);

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

    private static async Task SeedDemoDataAsync(IMSDbContext db, int businessId)
    {
        var rnd = new Random(42); // fixed seed for reproducibility
        var versionStamp = BitConverter.GetBytes(DateTime.UtcNow.Ticks);

        // 1. Categories
        var catElectronics = new TblCategory { BusinessId = businessId, CategoryName = "Electronics", Description = "Electronic devices", CreatedAt = DateTime.UtcNow };
        var catAccessories = new TblCategory { BusinessId = businessId, CategoryName = "Accessories", Description = "Tech accessories", CreatedAt = DateTime.UtcNow };
        db.TblCategories.AddRange(catElectronics, catAccessories);
        await db.SaveChangesAsync();

        var catPhones = new TblCategory { BusinessId = businessId, CategoryName = "Smartphones", ParentCategoryId = catElectronics.CategoryId, CreatedAt = DateTime.UtcNow };
        var catLaptops = new TblCategory { BusinessId = businessId, CategoryName = "Laptops", ParentCategoryId = catElectronics.CategoryId, CreatedAt = DateTime.UtcNow };
        var catAudio = new TblCategory { BusinessId = businessId, CategoryName = "Audio & Sound", ParentCategoryId = catAccessories.CategoryId, CreatedAt = DateTime.UtcNow };
        var catChargers = new TblCategory { BusinessId = businessId, CategoryName = "Chargers & Cables", ParentCategoryId = catAccessories.CategoryId, CreatedAt = DateTime.UtcNow };
        db.TblCategories.AddRange(catPhones, catLaptops, catAudio, catChargers);
        await db.SaveChangesAsync();

        // 2. Products
        var productsData = new List<(string Name, decimal Price, int CatId)>
        {
            ("iPhone 15 Pro Max 256GB", 3500000m, catPhones.CategoryId),
            ("iPhone 15 Pro 128GB", 3100000m, catPhones.CategoryId),
            ("iPhone 15 128GB", 2400000m, catPhones.CategoryId),
            ("Samsung Galaxy S24 Ultra 256GB", 3200000m, catPhones.CategoryId),
            ("Samsung Galaxy S24+ 256GB", 2800000m, catPhones.CategoryId),
            ("Google Pixel 8 Pro", 2600000m, catPhones.CategoryId),
            ("Xiaomi 14 Pro", 2100000m, catPhones.CategoryId),

            ("MacBook Pro M3 14-inch 512GB", 4800000m, catLaptops.CategoryId),
            ("MacBook Air M2 13-inch 256GB", 2900000m, catLaptops.CategoryId),
            ("Dell XPS 15", 4200000m, catLaptops.CategoryId),
            ("ASUS ROG Zephyrus G14", 3900000m, catLaptops.CategoryId),
            ("Lenovo ThinkPad X1 Carbon", 3800000m, catLaptops.CategoryId),
            ("HP Spectre x360", 3500000m, catLaptops.CategoryId),

            ("AirPods Pro (2nd Gen)", 650000m, catAudio.CategoryId),
            ("AirPods Max", 1500000m, catAudio.CategoryId),
            ("Sony WH-1000XM5", 950000m, catAudio.CategoryId),
            ("Bose QuietComfort Ultra", 1100000m, catAudio.CategoryId),
            ("JBL Charge 5 Bluetooth Speaker", 350000m, catAudio.CategoryId),
            ("Marshall Emberton II", 450000m, catAudio.CategoryId),

            ("Anker 65W GaN Charger", 85000m, catChargers.CategoryId),
            ("Apple 20W USB-C Power Adapter", 65000m, catChargers.CategoryId),
            ("Belkin MagSafe 3-in-1 Wireless Charger", 350000m, catChargers.CategoryId),
            ("Baseus 100W USB-C Cable 2m", 25000m, catChargers.CategoryId),
            ("UGREEN 10000mAh Power Bank", 95000m, catChargers.CategoryId),
            ("Samsung 45W Super Fast Charger", 110000m, catChargers.CategoryId)
        };

        var products = new List<TblInventory>();
        var inventorySummaries = new List<TblInventorySummary>();

        foreach (var p in productsData)
        {
            var inv = new TblInventory
            {
                BusinessId = businessId,
                InventoryName = p.Name,
                Price = p.Price,
                CategoryId = p.CatId,
                DeleteFlag = false,
                VersionStamp = versionStamp,
                CreatedAt = DateTime.UtcNow.AddDays(-365), // started 1 year ago
                UpdatedAt = DateTime.UtcNow
            };
            products.Add(inv);
        }
        db.TblInventories.AddRange(products);
        await db.SaveChangesAsync();

        foreach (var inv in products)
        {
            var initialStock = rnd.Next(50, 500);
            inventorySummaries.Add(new TblInventorySummary
            {
                BusinessId = businessId,
                InventoryId = inv.InventoryId,
                CurrentStock = initialStock,
                VersionStamp = versionStamp,
                LastUpdated = DateTime.UtcNow
            });
        }
        db.TblInventorySummaries.AddRange(inventorySummaries);
        await db.SaveChangesAsync();

        // 3. Customers
        var customerNames = new[] { 
            "U Aung Kyaw", "Daw Mya Mya", "Kyaw Zin Thant", "Thuzar Lin", "Zarni Tun", 
            "Su Su Hlaing", "Min Min", "Nilar Win", "Ye Lin Aung", "Khin Cho", 
            "Aung Ye Lin", "Phyo Phyo", "Zaw Myo Htet", "Moe Sandar", "Tun Tun Naing", "Myat Noe"
        };
        var customers = new List<TblCustomer>();
        var customerSummaries = new List<TblCustomerSummary>();

        foreach (var cName in customerNames)
        {
            var cus = new TblCustomer
            {
                BusinessId = businessId,
                CustomerName = cName,
                Phone = $"09-{rnd.Next(100, 999)}-{rnd.Next(100, 999)}-{rnd.Next(100, 999)}",
                Address = rnd.Next(2) == 0 ? "Yangon, Myanmar" : "Mandalay, Myanmar",
                VersionStamp = versionStamp,
                CreatedAt = DateTime.UtcNow.AddDays(-365),
                UpdatedAt = DateTime.UtcNow,
                DeleteFlag = false
            };
            customers.Add(cus);
        }
        db.TblCustomers.AddRange(customers);
        await db.SaveChangesAsync();

        foreach (var cus in customers)
        {
            customerSummaries.Add(new TblCustomerSummary
            {
                BusinessId = businessId,
                CustomerId = cus.CustomerId,
                TotalPurchased = 0,
                OutstandingBalance = 0,
                LastTransactionDate = null
            });
        }
        db.TblCustomerSummaries.AddRange(customerSummaries);
        await db.SaveChangesAsync();

        // 4. Sales Records for 1 year
        var startDate = DateTime.UtcNow.Date.AddDays(-365);
        var endDate = DateTime.UtcNow.Date;

        var reports = new List<TblReport>();
        var vouchers = new List<TblVoucher>();
        
        var currentDay = startDate;
        while (currentDay <= endDate)
        {
            // Number of sales per day (0 to 6, weighted a bit lower)
            int salesToday = rnd.Next(0, 7);
            if (currentDay.DayOfWeek == DayOfWeek.Sunday || currentDay.DayOfWeek == DayOfWeek.Saturday)
            {
                salesToday = rnd.Next(2, 10); // more sales on weekends
            }

            for (int s = 0; s < salesToday; s++)
            {
                // Assign random customer
                var customer = customers[rnd.Next(customers.Count)];
                
                // Assign random time on this day
                var reportTime = currentDay.AddHours(rnd.Next(9, 21)).AddMinutes(rnd.Next(0, 60)); // Between 9 AM and 9 PM
                
                var report = new TblReport
                {
                    BusinessId = businessId,
                    CustomerId = customer.CustomerId,
                    ReportDate = reportTime,
                    TotalAmount = 0 // Calculated below
                };
                reports.Add(report);
            }
            
            currentDay = currentDay.AddDays(1);
        }

        // Save reports first to get ReportId
        db.TblReports.AddRange(reports);
        await db.SaveChangesAsync();

        // Now generate vouchers per report
        foreach (var report in reports)
        {
            int itemsInOrder = rnd.Next(1, 4); // 1 to 3 distinct items
            decimal totalOrderAmount = 0;
            
            // Randomly select items (avoid duplicates in same order by shuffling/selecting)
            var selectedProducts = products.OrderBy(x => rnd.Next()).Take(itemsInOrder).ToList();

            foreach (var product in selectedProducts)
            {
                int qty = rnd.Next(1, 3);
                decimal subTotal = product.Price * qty;
                totalOrderAmount += subTotal;

                var voucher = new TblVoucher
                {
                    BusinessId = businessId,
                    ReportId = report.ReportId,
                    InventoryId = product.InventoryId,
                    Quantity = qty,
                    SellPrice = product.Price,
                    SubTotal = subTotal
                };
                vouchers.Add(voucher);

                // Update product stock (decrement)
                var invSummary = inventorySummaries.First(x => x.InventoryId == product.InventoryId);
                if (invSummary.CurrentStock != null)
                {
                    invSummary.CurrentStock -= qty;
                }
            }

            report.TotalAmount = totalOrderAmount;

            // Update customer summary
            var cusSummary = customerSummaries.First(x => x.CustomerId == report.CustomerId);
            cusSummary.TotalPurchased = (cusSummary.TotalPurchased ?? 0) + totalOrderAmount;
            if (cusSummary.LastTransactionDate == null || cusSummary.LastTransactionDate < report.ReportDate)
            {
                cusSummary.LastTransactionDate = report.ReportDate;
            }
        }

        db.TblVouchers.AddRange(vouchers);
        await db.SaveChangesAsync();
    }
}

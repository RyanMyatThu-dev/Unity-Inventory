using CloudinaryDotNet;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Unity_Inventory.Domain.Features.Authentication;
using Unity_Inventory.Domain.Features.Authentication.Tokens;
using Unity_Inventory.Domain.Features.Business;
using Unity_Inventory.Domain.Features.Authentication.Users;
using Unity_Inventory.Domain.Features.Inventories;
using Unity_Inventory.Domain.Features.Customers;
using Unity_Inventory.Domain.Features.Sales;
using Unity_Inventory.Domain.Features.CustomerPrices;
using Unity_Inventory.Domain.Features.PhotoUpload;
using Unity_Inventory.Domain.Features.Dashboard;
using Unity_Inventory.Domain.Features.Authorization;
using Unity_Inventory.Domain.Features.Search;


namespace Unity_Inventory.Domain.Features
{
    public static class FeaturesManager
    {
        public static void AddDomain(this WebApplicationBuilder builder)
        {
            builder.Services.AddDbContext<Unity_Inventory.Database.IMSDbContextModels.IMSDbContext>(options => 
            options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            //cloudinary config
            var cloudName = builder.Configuration["Cloudinary:CloudName"]?.Trim();
            var apiKey = builder.Configuration["Cloudinary:ApiKey"]?.Trim();
            var apiSecret = builder.Configuration["Cloudinary:ApiSecret"]?.Trim();
            var acc = new Account(cloudName, apiKey, apiSecret);
            builder.Services.AddSingleton(new Cloudinary(acc));

            builder.Services.AddScoped<IPhotoUploadService, PhotoUploadService>();
            builder.Services.AddScoped<IAuthService, AuthService>();
            builder.Services.AddScoped<ITokenService, TokenService>();
            builder.Services.AddScoped<IBusinessService, BusinessService>();
            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddScoped<IInventoryService, InventoryService>();
            builder.Services.AddScoped<ICustomerService, CustomerService>();
            builder.Services.AddScoped<ISalesService, SalesService>();
            builder.Services.AddScoped<ICustomerPriceService, CustomerPriceService>();
            builder.Services.AddScoped<IDashboardService, DashboardService>();
            builder.Services.AddScoped<IPermissionService, PermissionService>();
            builder.Services.AddScoped<ICategoryService, CategoryService>();
            builder.Services.AddScoped<ISearchService, SearchService>();

        }
    }
}

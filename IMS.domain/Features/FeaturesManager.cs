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
using IMS.Domain.Features.Authentication;
using IMS.Domain.Features.Authentication.Tokens;
using IMS.Domain.Features.Business;
using IMS.Domain.Features.Authentication.Users;
using IMS.Domain.Features.Inventories;
using IMS.Domain.Features.Customers;
using IMS.Domain.Features.Sales;
using IMS.Domain.Features.CustomerPrices;
using IMS.Domain.Features.PhotoUpload;


namespace IMS.Domain.Features
{
    public static class FeaturesManager
    {
        public static void AddDomain(this WebApplicationBuilder builder)
        {
            builder.Services.AddDbContext<IMS.Database.IMSDbContextModels.IMSDbContext>(options => 
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

        }
    }
}

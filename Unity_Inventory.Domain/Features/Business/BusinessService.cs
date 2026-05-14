using Unity_Inventory.Database.IMSDbContextModels;
using Unity_Inventory.Domain.Features.Authentication.Models;
using Unity_Inventory.Domain.Features.Authorization;
using Unity_Inventory.Domain.Features.Business.Models;
using Unity_Inventory.Shared;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Unity_Inventory.Domain.Features.Business
{
    public class BusinessService : IBusinessService
    {
        private readonly IMSDbContext _db;
        private readonly IPermissionService _permissionService;

        public BusinessService(IMSDbContext db, IPermissionService permissionService)
        {
            _db = db;
            _permissionService = permissionService;
        }

        public async Task<Result<BusinessAccessResponse>> CreateBusiness(BusinessCreateRequest request)
        {
            try
            {
                var accountUser = await _db.TblUsers.AsNoTracking()
                    .FirstOrDefaultAsync(u => u.UserId == request.OwnerUserId && !u.DeleteFlag);
                if (accountUser == null)
                    return Result<BusinessAccessResponse>.Failure("User not found.");

                var acct = accountUser.AccountType?.Trim();
                if (!string.IsNullOrEmpty(acct)
                    && !string.Equals(acct, "Owner", StringComparison.OrdinalIgnoreCase))
                    return Result<BusinessAccessResponse>.Failure("Your account type is not permitted to create businesses.");

                var existing = await _db.TblBusinesses.FirstOrDefaultAsync(b => b.BusinessName == request.BusinessName && b.OwnerId == request.OwnerUserId);
                if (existing != null)
                    return Result<BusinessAccessResponse>.Failure("Business with the same name already exists for this user.");
                var business = new TblBusiness
                {
                    BusinessName = request.BusinessName,
                    SubscriptionTier = request.SubscriptionTier,
                    OwnerId = request.OwnerUserId
                };

                var userBusiness = new TblUserBusiness
                {
                    UserId = request.OwnerUserId,
                    Business = business,
                    Role = "Owner"
                };

                await using var tx = await _db.Database.BeginTransactionAsync();

                _db.TblBusinesses.Add(business);
                _db.TblUserBusinesses.Add(userBusiness);
                await _db.SaveChangesAsync();

                await _permissionService.SeedDefaultRolePermissionsForBusinessAsync(business.BusinessId, request.OwnerUserId);

                await tx.CommitAsync();

                return Result<BusinessAccessResponse>.Success(new BusinessAccessResponse
                {
                    BusinessId = business.BusinessId,
                    BusinessName = business.BusinessName,
                    SubscriptionTier= business.SubscriptionTier,
                    Role = "Owner",

                });

            }
            catch (Exception ex)
            {
                return Result<BusinessAccessResponse>.Failure(ex.Message);
            }
        }

        public async Task<Result<List<BusinessAccessDto>>> GetBusinessesByUserIdAsync(int userId)
        {
            try
            {
                var businesses = await _db.TblUserBusinesses
                    .Include(ub => ub.Business)
                    .Where(ub => ub.UserId == userId)
                    .Select(b => new BusinessAccessDto
                    {
                        BusinessId = b.BusinessId,
                        BusinessName = b.Business.BusinessName,
                        Role = b.Role
                    })
                    .ToListAsync();
                return Result<List<BusinessAccessDto>>.Success(businesses, "Businesses retrieved successfully");
            }
            catch (Exception ex) {
                return Result<List<BusinessAccessDto>>.Failure(ex.Message);
            }
        }

        public async Task<Result<BusinessAccessDto>> VerifyBusinessAccessAsync(int userId, int businessId)
        {
            var access = await _db.TblUserBusinesses
                .Include(ub => ub.Business)
                .FirstOrDefaultAsync(ub => ub.UserId == userId && ub.BusinessId == businessId);

            if(access == null)
                return Result<BusinessAccessDto>.Failure("User does not have access to this business.");

            return Result<BusinessAccessDto>.Success(new BusinessAccessDto { 
                BusinessId = access.BusinessId,
                BusinessName = access.Business.BusinessName,
                Role = access.Role!
            });

        }
    }
}

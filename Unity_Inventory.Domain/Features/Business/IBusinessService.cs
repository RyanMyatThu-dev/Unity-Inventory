using Unity_Inventory.Database.IMSDbContextModels;
using Unity_Inventory.Domain.Features.Authentication.Models;
using Unity_Inventory.Domain.Features.Business.Models;
using Unity_Inventory.Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Unity_Inventory.Domain.Features.Business
{
    public interface IBusinessService
    {
        Task<Result<List<BusinessAccessDto>>> GetBusinessesByUserIdAsync(int userId);
        Task<Result<BusinessAccessResponse>> CreateBusiness(BusinessCreateRequest request);
        Task<Result<BusinessAccessDto>> VerifyBusinessAccessAsync(int userId, int businessId);

    }
}

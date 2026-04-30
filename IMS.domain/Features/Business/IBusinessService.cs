using IMS.Database.IMSDbContextModels;
using IMS.Domain.Features.Authentication.Models;
using IMS.Domain.Features.Business.Models;
using IMS.shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IMS.Domain.Features.Business
{
    public interface IBusinessService
    {
        Task<Result<List<BusinessAccessDto>>> GetBusinessesByUserIdAsync(int userId);
        Task<Result<BusinessAccessResponse>> CreateBusiness(BusinessCreateRequest request);
        Task<Result<BusinessAccessDto>> VerifyBusinessAccessAsync(int userId, int businessId);

    }
}

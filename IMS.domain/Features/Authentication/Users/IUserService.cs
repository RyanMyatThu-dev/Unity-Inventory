using IMS.Database.IMSDbContextModels;
using IMS.Domain.Features.Authentication.Models;
using IMS.shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IMS.Domain.Features.Authentication.Users
{
    public interface IUserService
    {
        Task<Result<UserResponse>> RegisterUserAsync(UserRegisterRequest request);
        Task<Result<UserResponse>> UpdateAsync(int id, UserUpdateRequest request, int currentUserId);
        Task<Result<UserResponse>> DeleteAsync(int id);
        Task<Result<UserResponse>> ChangePasswordAsync(int id, ChangePasswordRequest request, int currentUserId);
        Task<Result<TblUser>> GetByIdAsync(int id);
        
    }
}

using Unity_Inventory.Database.IMSDbContextModels;
using Unity_Inventory.Domain.Features.Authentication.Models;
using Unity_Inventory.Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Unity_Inventory.Domain.Features.Authentication.Users
{
    public interface IUserService
    {
        Task<Result<UserResponse>> RegisterUserAsync(UserRegisterRequest request);
        Task<Result<UserResponse>> UpdateAsync(int id, UserUpdateRequest request, int currentUserId);
        Task<Result<UserResponse>> DeleteAsync(int id);
        Task<Result<UserResponse>> ChangePasswordAsync(int id, ChangePasswordRequest request, int currentUserId);
        Task<Result<TblUser>> GetByIdAsync(int id);
        Task<Result<IEnumerable<UserDto>>> GetUsersAsync(int businessId);
            }
}

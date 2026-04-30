using IMS.Database.IMSDbContextModels;
using IMS.Domain.Features.Authentication.Models;
using IMS.shared;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IMS.Domain.Features.Authentication.Users
{
    public class UserService : IUserService
    {
        private readonly IMSDbContext _db;
        
        public UserService(IMSDbContext db)
        {
            _db = db;
        }

        #region Validate Email and Password
        private bool ValidateEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }

        private bool ValidatePassword(string password)
        {
            if (password.Length < 6)
                return false;
            bool hasUpper = password.Any(char.IsUpper);
            bool hasLower = password.Any(char.IsLower);
            bool hasDigit = password.Any(char.IsDigit);
            return hasUpper && hasLower && hasDigit;
        }
        #endregion

        #region Register User
        public async Task<Result<UserResponse>> RegisterUserAsync(UserRegisterRequest request)
        {
            if(string.IsNullOrEmpty(request.Name)) return Result<UserResponse>.Failure("Name is required.");

            if (!string.IsNullOrEmpty(request.Email) && !ValidateEmail(request.Email) || !ValidatePassword(request.Password))
            {
                return Result<UserResponse>.Failure("Invalid email or password format.");
            }

            var existingUser = await _db.TblUsers.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existingUser != null)
            {
                return Result<UserResponse>.Failure("User with this email already exists.");
            }

            var user = new TblUser
            {
                Name = request.Name,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                CreatedAt = DateTime.UtcNow,
                DeleteFlag = false,
            };

            try
            {
                _db.Add(user);
                await _db.SaveChangesAsync();

                return Result<UserResponse>.Success(new UserResponse
                {
                    IsSuccess = true,
                    Message = "User registered successfully.",
                    UserId = user.UserId
                });

            } catch(Exception ex)
            {
                return Result<UserResponse>.Failure($"An error occurred while creating the user: {ex.Message}");
            }

        }
        #endregion

        #region Update User
        public async Task<Result<UserResponse>> UpdateAsync(int id, UserUpdateRequest request, int currentUserId)
        {
            if(id != currentUserId) return Result<UserResponse>.Failure("Unauthorized to update this user.");

            var user = await _db.TblUsers.FirstOrDefaultAsync(u => u.UserId == id && !u.DeleteFlag);
            if(user == null)
            {
                return Result<UserResponse>.Failure("User not found.");
            }
            if (!string.IsNullOrEmpty(request.Name))
            {
                user.Name = request.Name;
            }
            if (!string.IsNullOrEmpty(request.Email))
            {
                if(!ValidateEmail(request.Email))
                {
                    return Result<UserResponse>.Failure("Invalid email format.");
                }
                var emailExists = await _db.TblUsers.FirstOrDefaultAsync(u => u.Email == request.Email && u.UserId != id);
                if (emailExists != null)
                {
                    return Result<UserResponse>.Failure("Email is already in use.");
                }
                user.Email = request.Email;
            }

            user.UpdatedAt = DateTime.UtcNow;

            try
            {
                _db.Update(user);
                await _db.SaveChangesAsync();

                return Result<UserResponse>.Success(new UserResponse
                {
                    IsSuccess = true,
                    Message = "User updated successfully.",
                    UserId = user.UserId
                });

            } catch(Exception ex)
            {
                return Result<UserResponse>.Failure($"An error occurred while updating the user: {ex.Message}");
            }
        }
        #endregion

        #region Delete User

        public async Task<Result<UserResponse>> DeleteAsync(int id)
        {
           var user = await _db.TblUsers.FirstOrDefaultAsync( u => u.UserId == id && !u.DeleteFlag);
            if(user == null)
            {
                return Result<UserResponse>.Failure("User not found.");
            }
            user.DeleteFlag = true;
            user.UpdatedAt = DateTime.UtcNow;
            try
            {
                _db.Update(user);
                await _db.SaveChangesAsync();
                return Result<UserResponse>.Success(new UserResponse
                {
                    IsSuccess = true,
                    Message = "User deleted successfully.",
                    UserId = user.UserId
                });
            } catch(Exception ex)
            {
                return Result<UserResponse>.Failure($"An error occurred while deleting the user: {ex.Message}");
            }
        }
        #endregion

        #region Change Password
        public async Task<Result<UserResponse>> ChangePasswordAsync(int id, ChangePasswordRequest request, int currentUserId)
        {
            if(id != currentUserId) return Result<UserResponse>.Failure("Unauthorized to change password for this user.");
            var user = await _db.TblUsers.FirstOrDefaultAsync(u => u.UserId == id && !u.DeleteFlag);
            if(user == null)
            {
                return Result<UserResponse>.Failure("User not found.");
            }
            if(!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
            {
                return Result<UserResponse>.Failure("Current password is incorrect.");
            }
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;
            try
            {
                _db.Update(user);
                await _db.SaveChangesAsync();
                return Result<UserResponse>.Success(new UserResponse
                {
                    IsSuccess = true,
                    Message = "Password changed successfully.",
                    UserId = user.UserId
                });
            } catch(Exception ex)
            {
                return Result<UserResponse>.Failure($"An error occurred while changing the password: {ex.Message}");
            }
        }
        #endregion

        public async Task<Result<TblUser>> GetByIdAsync(int id)
        {
            var user = await _db.TblUsers.FirstOrDefaultAsync(u => u.UserId == id && !u.DeleteFlag);
            if(user == null)
            {
                return Result<TblUser>.Failure("User not found.");
            }
            return Result<TblUser>.Success(user, "User retrieved successfully.");
        }

    }
}

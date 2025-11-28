using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RandevuSistemi.Api.Data;
using RandevuSistemi.Api.Models;

namespace RandevuSistemi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public AdminController(AppDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        [HttpPost("departments")]
        public async Task<IActionResult> CreateDepartment([FromBody] Department department)
        {
            if (string.IsNullOrWhiteSpace(department.Name))
            {
                return BadRequest("Department name is required");
            }

            var trimmedName = department.Name.Trim();
            if (trimmedName.Length < 2)
            {
                return BadRequest("Department name must be at least 2 characters");
            }

            if (trimmedName.Length > 100)
            {
                return BadRequest("Department name must be at most 100 characters");
            }

            var existing = await _db.Departments.FirstOrDefaultAsync(d => d.Name.Trim().ToLower() == trimmedName.ToLower());
            if (existing != null)
            {
                return Conflict("A department with this name already exists");
            }

            department.Name = trimmedName;
            _db.Departments.Add(department);
            await _db.SaveChangesAsync();
            return Ok(department);
        }

        public record CreateBranchRequest(string Name);
        [HttpPost("departments/{departmentId}/branches")]
        public async Task<IActionResult> CreateBranch(int departmentId, [FromBody] CreateBranchRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest("Branch name is required");
            }

            var trimmedName = request.Name.Trim();
            if (trimmedName.Length < 2)
            {
                return BadRequest("Branch name must be at least 2 characters");
            }

            if (trimmedName.Length > 100)
            {
                return BadRequest("Branch name must be at most 100 characters");
            }

            var department = await _db.Departments.Include(d => d.Branches).FirstOrDefaultAsync(d => d.Id == departmentId);
            if (department == null)
            {
                return NotFound("Department not found");
            }

            var existing = department.Branches?.FirstOrDefault(b => b.Name.Trim().ToLower() == trimmedName.ToLower());
            if (existing != null)
            {
                return Conflict("A branch with this name already exists in this department");
            }

            var branch = new Branch { Name = trimmedName, DepartmentId = departmentId };
            _db.Branches.Add(branch);
            await _db.SaveChangesAsync();
            return Ok(branch);
        }

        public record AssignProviderRequest(string UserId, int BranchId);
        [HttpPost("assign-provider")]
        public async Task<IActionResult> AssignProvider([FromBody] AssignProviderRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.UserId))
            {
                return BadRequest("UserId is required");
            }

            if (request.BranchId <= 0)
            {
                return BadRequest("Invalid BranchId");
            }

            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null) return NotFound("User not found");

            var branch = await _db.Branches.FindAsync(request.BranchId);
            if (branch == null) return NotFound("Branch not found");

            var existing = await _db.ServiceProviderProfiles.FirstOrDefaultAsync(x => x.UserId == request.UserId);
            if (existing == null)
            {
                existing = new ServiceProviderProfile
                {
                    UserId = request.UserId,
                    BranchId = request.BranchId
                };
                _db.ServiceProviderProfiles.Add(existing);
            }
            else
            {
                var oldBranchId = existing.BranchId;
                if (oldBranchId != request.BranchId)
                {
                    var today = DateOnly.FromDateTime(DateTime.Now);
                    var nowTime = TimeOnly.FromDateTime(DateTime.Now);

                    var futureAppointments = await _db.Appointments
                        .Where(a => a.ServiceProviderProfileId == existing.Id
                            && (a.Date > today || (a.Date == today && a.StartTime >= nowTime)))
                        .ToListAsync();

                    if (futureAppointments.Any())
                    {
                        _db.Appointments.RemoveRange(futureAppointments);
                    }
                }

                existing.BranchId = request.BranchId;
            }
            await _db.SaveChangesAsync();
            await _userManager.AddToRoleAsync(user, "ServiceProvider");
            return Ok(existing);
        }

        public record AssignOperatorRequest(string UserId, int BranchId);
        [HttpPost("assign-operator")]
        public async Task<IActionResult> AssignOperator([FromBody] AssignOperatorRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.UserId))
            {
                return BadRequest("UserId is required");
            }

            if (request.BranchId <= 0)
            {
                return BadRequest("Invalid BranchId");
            }

            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null) return NotFound("User not found");

            var branch = await _db.Branches.FindAsync(request.BranchId);
            if (branch == null) return NotFound("Branch not found");

            var existing = await _db.OperatorProfiles.FirstOrDefaultAsync(x => x.UserId == request.UserId);
            if (existing == null)
            {
                existing = new OperatorProfile
                {
                    UserId = request.UserId,
                    BranchId = request.BranchId
                };
                _db.OperatorProfiles.Add(existing);
            }
            else
            {
                existing.BranchId = request.BranchId;
            }
            await _db.SaveChangesAsync();
            await _userManager.AddToRoleAsync(user, "Operator");
            return Ok(existing);
        }

        public record AssignRoleRequest(string UserId, string Role);
        [HttpPost("assign-role")]
        public async Task<IActionResult> AssignRole([FromBody] AssignRoleRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.UserId))
            {
                return BadRequest("UserId is required");
            }

            if (string.IsNullOrWhiteSpace(request.Role))
            {
                return BadRequest("Role is required");
            }

            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null) return NotFound("User not found");

            var validRoles = new[] { "Admin", "Operator", "ServiceProvider", "User" };
            if (!validRoles.Contains(request.Role))
            {
                return BadRequest("Invalid role. Valid roles are: Admin, Operator, ServiceProvider, User");
            }

            await _userManager.AddToRoleAsync(user, request.Role);
            return Ok();
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _userManager.Users.ToListAsync();
            var result = new List<object>();
            foreach (var u in users)
            {
                var roles = await _userManager.GetRolesAsync(u);
                result.Add(new { u.Id, u.Email, u.FullName, Roles = roles });
            }
            return Ok(result);
        }

        [HttpGet("users/search")]
        public async Task<IActionResult> SearchUsers(
            [FromQuery] string? query = "",
            [FromQuery] int? departmentId = null,
            [FromQuery] int? branchId = null)
        {
            var queryLower = (query ?? "").ToLower().Trim();
            var usersQuery = _userManager.Users.AsQueryable();

            if (!string.IsNullOrEmpty(queryLower))
            {
                usersQuery = usersQuery.Where(u =>
                    (u.Email != null && u.Email.ToLower().Contains(queryLower)) ||
                    (u.FullName != null && u.FullName.ToLower().Contains(queryLower)));
            }

            if (branchId.HasValue)
            {
                var providerUserIds = await _db.ServiceProviderProfiles
                    .Where(sp => sp.BranchId == branchId.Value)
                    .Select(sp => sp.UserId)
                    .ToListAsync();

                var operatorUserIds = await _db.OperatorProfiles
                    .Where(op => op.BranchId == branchId.Value)
                    .Select(op => op.UserId)
                    .ToListAsync();

                var allUserIds = providerUserIds.Union(operatorUserIds).ToList();
                usersQuery = usersQuery.Where(u => allUserIds.Contains(u.Id));
            }
            else if (departmentId.HasValue)
            {
                var branchIds = await _db.Branches
                    .Where(b => b.DepartmentId == departmentId.Value)
                    .Select(b => b.Id)
                    .ToListAsync();

                var providerUserIds = await _db.ServiceProviderProfiles
                    .Where(sp => branchIds.Contains(sp.BranchId))
                    .Select(sp => sp.UserId)
                    .ToListAsync();

                var operatorUserIds = await _db.OperatorProfiles
                    .Where(op => branchIds.Contains(op.BranchId))
                    .Select(op => op.UserId)
                    .ToListAsync();

                var allUserIds = providerUserIds.Union(operatorUserIds).ToList();
                usersQuery = usersQuery.Where(u => allUserIds.Contains(u.Id));
            }

            var users = await usersQuery.ToListAsync();

            var result = new List<object>();
            foreach (var u in users)
            {
                var roles = await _userManager.GetRolesAsync(u);
                if (!roles.Contains("Admin"))
                {
                    result.Add(new { u.Id, u.Email, u.FullName, Roles = roles });
                }
            }
            return Ok(result);
        }

        [HttpGet("users/{userId}/details")]
        public async Task<IActionResult> GetUserDetails(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound("User not found");

            var roles = await _userManager.GetRolesAsync(user);

            var providerProfile = await _db.ServiceProviderProfiles
                .Include(sp => sp.Branch)
                .ThenInclude(b => b.Department)
                .FirstOrDefaultAsync(sp => sp.UserId == userId);

            var operatorProfile = await _db.OperatorProfiles
                .Include(op => op.Branch)
                .ThenInclude(b => b.Department)
                .FirstOrDefaultAsync(op => op.UserId == userId);

            var result = new
            {
                user.Id,
                user.Email,
                user.FullName,
                Roles = roles,
                Branch = providerProfile != null ? new
                {
                    providerProfile.Branch.Id,
                    providerProfile.Branch.Name,
                    Department = new
                    {
                        providerProfile.Branch.Department.Id,
                        providerProfile.Branch.Department.Name
                    }
                } : operatorProfile != null ? new
                {
                    operatorProfile.Branch.Id,
                    operatorProfile.Branch.Name,
                    Department = new
                    {
                        operatorProfile.Branch.Department.Id,
                        operatorProfile.Branch.Department.Name
                    }
                } : null
            };

            return Ok(result);
        }

        [HttpDelete("users/{userId}")]
        public async Task<IActionResult> DeleteUser(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound("User not found");

            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (currentUserId == userId)
            {
                return BadRequest("You cannot delete your own account");
            }

            var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
            if (isAdmin)
            {
                var adminCount = (await _userManager.GetUsersInRoleAsync("Admin")).Count;
                if (adminCount <= 1)
                {
                    return BadRequest("Cannot delete the last admin user");
                }
            }

            var result = await _userManager.DeleteAsync(user);
            if (result.Succeeded)
            {
                return Ok(new { message = "User deleted successfully" });
            }
            return BadRequest(result.Errors);
        }

        public record UpdateUserRoleRequest(string Role);
        [HttpPut("users/{userId}/role")]
        public async Task<IActionResult> UpdateUserRole(string userId, [FromBody] UpdateUserRoleRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Role))
            {
                return BadRequest("Role is required");
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound("User not found");

            var validRoles = new[] { "Admin", "Operator", "ServiceProvider", "User" };
            if (!validRoles.Contains(request.Role))
            {
                return BadRequest("Invalid role. Valid roles are: Admin, Operator, ServiceProvider, User");
            }

            var currentRoles = await _userManager.GetRolesAsync(user);

            await _userManager.RemoveFromRolesAsync(user, currentRoles);

            await _userManager.AddToRoleAsync(user, request.Role);

            return Ok(new { message = "User role updated successfully" });
        }

        public record UpdateUserBranchRequest(int BranchId);
        [HttpPut("users/{userId}/branch")]
        public async Task<IActionResult> UpdateUserBranch(string userId, [FromBody] UpdateUserBranchRequest request)
        {
            if (request.BranchId <= 0)
            {
                return BadRequest("Invalid BranchId");
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound("User not found");

            var branch = await _db.Branches.FindAsync(request.BranchId);
            if (branch == null) return NotFound("Branch not found");

            var roles = await _userManager.GetRolesAsync(user);
            var isProvider = roles.Contains("ServiceProvider");
            var isOperator = roles.Contains("Operator");

            if (!isProvider && !isOperator)
            {
                return BadRequest("User must have ServiceProvider or Operator role to assign a branch");
            }

            if (isProvider)
            {
                var providerProfile = await _db.ServiceProviderProfiles.FirstOrDefaultAsync(sp => sp.UserId == userId);

                if (providerProfile == null)
                {
                    providerProfile = new ServiceProviderProfile
                    {
                        UserId = userId,
                        BranchId = request.BranchId
                    };
                    _db.ServiceProviderProfiles.Add(providerProfile);
                }
                else
                {
                    var oldBranchId = providerProfile.BranchId;
                    if (oldBranchId != request.BranchId)
                    {
                        var today = DateOnly.FromDateTime(DateTime.Now);
                        var nowTime = TimeOnly.FromDateTime(DateTime.Now);

                        var futureAppointments = await _db.Appointments
                            .Where(a => a.ServiceProviderProfileId == providerProfile.Id
                                && (a.Date > today || (a.Date == today && a.StartTime >= nowTime)))
                            .ToListAsync();

                        if (futureAppointments.Any())
                        {
                            _db.Appointments.RemoveRange(futureAppointments);
                        }
                    }

                    providerProfile.BranchId = request.BranchId;
                }
            }

            if (isOperator)
            {
                var operatorProfile = await _db.OperatorProfiles.FirstOrDefaultAsync(op => op.UserId == userId);
                if (operatorProfile == null)
                {
                    operatorProfile = new OperatorProfile
                    {
                        UserId = userId,
                        BranchId = request.BranchId
                    };
                    _db.OperatorProfiles.Add(operatorProfile);
                }
                else
                {
                    operatorProfile.BranchId = request.BranchId;
                }
            }

            await _db.SaveChangesAsync();
            return Ok(new { message = "User branch updated successfully" });
        }
    }
}

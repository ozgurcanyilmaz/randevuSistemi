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
                existing.BranchId = request.BranchId;
            }
            await _db.SaveChangesAsync();
            await _userManager.AddToRoleAsync(user, "ServiceProvider");
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
    }
}
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
            _db.Departments.Add(department);
            await _db.SaveChangesAsync();
            return Ok(department);
        }

        public record CreateBranchRequest(string Name);
        [HttpPost("departments/{departmentId}/branches")]
        public async Task<IActionResult> CreateBranch(int departmentId, [FromBody] CreateBranchRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest("Name is required");
            var branch = new Branch { Name = request.Name, DepartmentId = departmentId };
            _db.Branches.Add(branch);
            await _db.SaveChangesAsync();
            return Ok(branch);
        }

        public record AssignProviderRequest(string UserId, int BranchId);
        [HttpPost("assign-provider")]
        public async Task<IActionResult> AssignProvider([FromBody] AssignProviderRequest request)
        {
            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null) return NotFound("User not found");

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
            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null) return NotFound("User not found");

            // Validate role
            var validRoles = new[] { "Admin", "Operator", "ServiceProvider", "User" };
            if (!validRoles.Contains(request.Role))
            {
                return BadRequest("Invalid role");
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
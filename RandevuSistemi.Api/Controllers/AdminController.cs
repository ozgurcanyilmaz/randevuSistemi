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

        [HttpGet("appointments/search")]
        public async Task<IActionResult> SearchAppointments([FromQuery] string? name, [FromQuery] DateOnly? date)
        {
            var q = _db.Appointments.Include(a => a.User).AsQueryable();
            if (date.HasValue)
            {
                q = q.Where(a => a.Date == date.Value);
            }
            if (!string.IsNullOrWhiteSpace(name))
            {
                var nameLower = name.ToLower();
                q = q.Where(a => (a.User.FullName != null && a.User.FullName.ToLower().Contains(nameLower)) || (a.User.Email != null && a.User.Email.ToLower().Contains(nameLower)));
            }
            var items = await q.OrderBy(a => a.Date).ThenBy(a => a.StartTime)
                .Select(a => new { a.Id, a.Date, a.StartTime, a.EndTime, a.ServiceProviderProfileId, User = a.User.FullName ?? a.User.Email, a.CheckedInAt })
                .ToListAsync();
            return Ok(items);
        }

        public record CheckInRequest(int AppointmentId);
        [HttpPost("appointments/check-in")]
        public async Task<IActionResult> CheckIn([FromBody] CheckInRequest req)
        {
            var appt = await _db.Appointments.FindAsync(req.AppointmentId);
            if (appt == null) return NotFound();
            if (appt.CheckedInAt != null) return BadRequest("Already checked in");
            appt.CheckedInAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { appt.Id, appt.CheckedInAt });
        }

        public record CreateAppointmentRequest(int ProviderId, DateOnly Date, TimeOnly Start, TimeOnly End, string? Notes, string UserId);
        [HttpPost("appointments")] 
        public async Task<IActionResult> CreateAppointment([FromBody] CreateAppointmentRequest req)
        {
            // Disallow booking for past times on the same day
            var today = DateOnly.FromDateTime(DateTime.Now);
            if (req.Date == today)
            {
                var nowTime = TimeOnly.FromDateTime(DateTime.Now);
                if (req.Start <= nowTime)
                {
                    return BadRequest("Cannot book past time slots on the same day.");
                }
            }
            var provider = await _db.ServiceProviderProfiles.Include(p => p.Appointments).FirstOrDefaultAsync(p => p.Id == req.ProviderId);
            if (provider == null) return NotFound("Provider not found");

            // Validate session
            var expected = TimeSpan.FromMinutes(provider.SessionDurationMinutes);
            var actual = req.End.ToTimeSpan() - req.Start.ToTimeSpan();
            if (actual != expected) return BadRequest($"Invalid session length. Expected {provider.SessionDurationMinutes} minutes.");

            // Validate within working hours and breaks
            var workForDay = await _db.WorkingHours.Where(w => w.ServiceProviderProfileId == provider.Id && w.DayOfWeek == req.Date.DayOfWeek).ToListAsync();
            if (!workForDay.Any()) return BadRequest("Provider has no working hours on selected day.");
            bool insideWorking = workForDay.Any(w => req.Start >= w.StartTime && req.End <= w.EndTime);
            if (!insideWorking) return BadRequest("Selected time is outside working hours.");
            var breaksForDay = await _db.BreakPeriods.Where(b => b.ServiceProviderProfileId == provider.Id && b.DayOfWeek == req.Date.DayOfWeek).ToListAsync();
            bool overlapsBreak = breaksForDay.Any(b => !(req.End <= b.StartTime || req.Start >= b.EndTime));
            if (overlapsBreak) return BadRequest("Selected time overlaps a break period.");

            bool conflict = provider.Appointments.Any(a => a.Date == req.Date && !(req.End <= a.StartTime || req.Start >= a.EndTime));
            if (conflict) return Conflict("Slot already taken");

            if (string.IsNullOrWhiteSpace(req.UserId)) return BadRequest("UserId is required");

            var appt = new Appointment
            {
                ServiceProviderProfileId = req.ProviderId,
                UserId = req.UserId,
                Date = req.Date,
                StartTime = req.Start,
                EndTime = req.End,
                Notes = req.Notes
            };
            _db.Appointments.Add(appt);
            await _db.SaveChangesAsync();
            return Ok(appt);
        }
    }
}



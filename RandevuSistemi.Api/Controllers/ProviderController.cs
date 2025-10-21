using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RandevuSistemi.Api.Data;
using RandevuSistemi.Api.Models;
using System.Security.Claims;

namespace RandevuSistemi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "ServiceProvider")]
    public class ProviderController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ProviderController(AppDbContext db)
        {
            _db = db;
        }

        private async Task<ServiceProviderProfile?> GetMyProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            return await _db.ServiceProviderProfiles.Include(p => p.WorkingHours).Include(p => p.BreakPeriods).FirstOrDefaultAsync(p => p.UserId == userId);
        }

        [HttpPost("session-duration/{minutes:int}")]
        public async Task<IActionResult> SetSessionDuration(int minutes)
        {
            var profile = await GetMyProfile();
            if (profile == null) return NotFound("Provider profile not found");
            profile.SessionDurationMinutes = minutes;
            await _db.SaveChangesAsync();
            return Ok(profile);
        }

        public record WorkingHoursRequest(DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime);
        [HttpPost("working-hours")]
        public async Task<IActionResult> SetWorkingHours([FromBody] List<WorkingHoursRequest> hours)
        {
            var profile = await GetMyProfile();
            if (profile == null) return NotFound("Provider profile not found");
            var existing = _db.WorkingHours.Where(w => w.ServiceProviderProfileId == profile.Id);
            _db.WorkingHours.RemoveRange(existing);
            foreach (var h in hours)
            {
                _db.WorkingHours.Add(new WorkingHours
                {
                    ServiceProviderProfileId = profile.Id,
                    DayOfWeek = h.DayOfWeek,
                    StartTime = h.StartTime,
                    EndTime = h.EndTime
                });
            }
            await _db.SaveChangesAsync();
            return Ok();
        }

        public record BreakRequest(DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime);
        [HttpPost("breaks")]
        public async Task<IActionResult> SetBreaks([FromBody] List<BreakRequest> breaks)
        {
            var profile = await GetMyProfile();
            if (profile == null) return NotFound("Provider profile not found");
            var existing = _db.BreakPeriods.Where(b => b.ServiceProviderProfileId == profile.Id);
            _db.BreakPeriods.RemoveRange(existing);
            foreach (var b in breaks)
            {
                _db.BreakPeriods.Add(new BreakPeriod
                {
                    ServiceProviderProfileId = profile.Id,
                    DayOfWeek = b.DayOfWeek,
                    StartTime = b.StartTime,
                    EndTime = b.EndTime
                });
            }
            await _db.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("appointments")]
        public async Task<IActionResult> MyAppointments()
        {
            var profile = await GetMyProfile();
            if (profile == null) return NotFound("Provider profile not found");
            var appts = await _db.Appointments
                .Where(a => a.ServiceProviderProfileId == profile.Id)
                .OrderByDescending(a => a.Date).ThenBy(a => a.StartTime)
                .Select(a => new { a.Id, a.Date, a.StartTime, a.EndTime, a.UserId, FullName = a.User.FullName, a.CheckedInAt })
                .ToListAsync();
            return Ok(appts);
        }

        [HttpGet("waiting")]
        public async Task<IActionResult> WaitingUsers()
        {
            var profile = await GetMyProfile();
            if (profile == null) return NotFound("Provider profile not found");
            var today = DateOnly.FromDateTime(DateTime.Now);
            var items = await _db.Appointments
                .Where(a => a.ServiceProviderProfileId == profile.Id && a.CheckedInAt != null)
                .Where(a => DateOnly.FromDateTime(a.CheckedInAt!.Value.LocalDateTime.Date) == today)
                .OrderBy(a => a.CheckedInAt)
                .Select(a => new { a.Id, a.Date, a.StartTime, a.EndTime, a.CheckedInAt, FullName = a.User.FullName })
                .ToListAsync();
            return Ok(items);
        }
    }
}



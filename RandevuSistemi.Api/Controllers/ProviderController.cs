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

        [HttpGet("parameters")]
        public async Task<IActionResult> GetParameters()
        {
            var profile = await GetMyProfile();
            if (profile == null) return NotFound("Provider profile not found");

            var workingHours = profile.WorkingHours.Select(w => new
            {
                dayOfWeek = (int)w.DayOfWeek,
                startTime = w.StartTime.ToString("HH:mm"),
                endTime = w.EndTime.ToString("HH:mm")
            }).ToList();

            var breaks = profile.BreakPeriods.Select(b => new
            {
                dayOfWeek = (int)b.DayOfWeek,
                startTime = b.StartTime.ToString("HH:mm"),
                endTime = b.EndTime.ToString("HH:mm")
            }).ToList();

            return Ok(new
            {
                sessionDurationMinutes = profile.SessionDurationMinutes,
                workingHours,
                breaks
            });
        }

        [HttpPost("session-duration/{minutes:int}")]
        public async Task<IActionResult> SetSessionDuration(int minutes)
        {
            if (minutes < 5 || minutes > 240)
            {
                return BadRequest("Session duration must be between 5 and 240 minutes.");
            }

            if (minutes % 5 != 0)
            {
                return BadRequest("Session duration must be a multiple of 5 minutes.");
            }

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
            if (hours == null || hours.Count == 0)
            {
                return BadRequest("Working hours list cannot be empty.");
            }

            foreach (var h in hours)
            {
                if (h.StartTime >= h.EndTime)
                {
                    return BadRequest($"Start time must be before end time for {h.DayOfWeek}.");
                }
            }

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
            if (breaks == null)
            {
                return BadRequest("Breaks list cannot be null.");
            }

            foreach (var b in breaks)
            {
                if (b.StartTime >= b.EndTime)
                {
                    return BadRequest($"Break start time must be before end time for {b.DayOfWeek}.");
                }
            }

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
                .Select(a => new { a.Id, a.Date, a.StartTime, a.EndTime, a.UserId, FullName = a.User.FullName, a.CheckedInAt, a.Notes, a.ProviderNotes, a.ServiceProviderProfileId })
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

        public record AddProviderNoteRequest(int AppointmentId, string ProviderNotes);
        [HttpPost("appointments/add-note")]
        public async Task<IActionResult> AddProviderNote([FromBody] AddProviderNoteRequest req)
        {
            if (req.AppointmentId <= 0)
            {
                return BadRequest("Invalid appointment ID");
            }

            if (req.ProviderNotes != null && req.ProviderNotes.Length > 2000)
            {
                return BadRequest("Provider notes must be at most 2000 characters");
            }

            var profile = await GetMyProfile();
            if (profile == null) return NotFound("Provider profile not found");

            var appt = await _db.Appointments.FirstOrDefaultAsync(a => a.Id == req.AppointmentId && a.ServiceProviderProfileId == profile.Id);
            if (appt == null) return NotFound("Appointment not found");

            appt.ProviderNotes = req.ProviderNotes?.Trim();
            await _db.SaveChangesAsync();
            return Ok(new { appt.Id, appt.ProviderNotes });
        }

        public record CreateFollowUpRequest(string UserId, DateOnly Date, TimeOnly Start, TimeOnly End, string? Notes);
        [HttpPost("appointments/create-followup")]
        public async Task<IActionResult> CreateFollowUp([FromBody] CreateFollowUpRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.UserId))
            {
                return BadRequest("UserId is required");
            }

            if (req.Notes != null && req.Notes.Length > 1000)
            {
                return BadRequest("Notes must be at most 1000 characters");
            }

            var profile = await GetMyProfile();
            if (profile == null) return NotFound("Provider profile not found");

            var expected = TimeSpan.FromMinutes(profile.SessionDurationMinutes);
            var actual = req.End.ToTimeSpan() - req.Start.ToTimeSpan();
            if (actual != expected) return BadRequest($"Invalid session length. Expected {profile.SessionDurationMinutes} minutes.");

            var workForDay = await _db.WorkingHours.Where(w => w.ServiceProviderProfileId == profile.Id && w.DayOfWeek == req.Date.DayOfWeek).ToListAsync();
            if (!workForDay.Any()) return BadRequest("Provider has no working hours on selected day.");
            bool insideWorking = workForDay.Any(w => req.Start >= w.StartTime && req.End <= w.EndTime);
            if (!insideWorking) return BadRequest("Selected time is outside working hours.");
            var breaksForDay = await _db.BreakPeriods.Where(b => b.ServiceProviderProfileId == profile.Id && b.DayOfWeek == req.Date.DayOfWeek).ToListAsync();
            bool overlapsBreak = breaksForDay.Any(b => !(req.End <= b.StartTime || req.Start >= b.EndTime));
            if (overlapsBreak) return BadRequest("Selected time overlaps a break period.");

            var existingAppts = await _db.Appointments.Where(a => a.ServiceProviderProfileId == profile.Id && a.Date == req.Date).ToListAsync();
            bool conflict = existingAppts.Any(a => !(req.End <= a.StartTime || req.Start >= a.EndTime));
            if (conflict) return Conflict("Slot already taken");

            var appt = new Appointment
            {
                ServiceProviderProfileId = profile.Id,
                UserId = req.UserId,
                Date = req.Date,
                StartTime = req.Start,
                EndTime = req.End,
                Notes = req.Notes?.Trim()
            };
            _db.Appointments.Add(appt);
            await _db.SaveChangesAsync();
            return Ok(appt);
        }
    }
}
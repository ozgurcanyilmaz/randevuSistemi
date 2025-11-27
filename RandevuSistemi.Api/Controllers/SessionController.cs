using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RandevuSistemi.Api.Data;
using RandevuSistemi.Api.Models;
using System.Security.Claims;

namespace RandevuSistemi.Api.Controllers
{
    [ApiController]
    [Route("api/provider/[controller]")]
    [Authorize(Roles = "ServiceProvider")]
    public class SessionsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public SessionsController(AppDbContext db)
        {
            _db = db;
        }

        private async Task<ServiceProviderProfile?> GetMyProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            return await _db.ServiceProviderProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);
        }

        public record StartSessionRequest(int AppointmentId, string Summary);
        [HttpPost("start")]
        public async Task<IActionResult> StartSession([FromBody] StartSessionRequest req)
        {
            if (req.AppointmentId <= 0)
            {
                return BadRequest("Invalid appointment ID");
            }
            
            if (string.IsNullOrWhiteSpace(req.Summary))
            {
                return BadRequest("Summary is required");
            }
            
            if (req.Summary.Length > 500)
            {
                return BadRequest("Summary must be at most 500 characters");
            }
            
            var profile = await GetMyProfile();
            if (profile == null) return NotFound("Provider profile not found");

            var appointment = await _db.Appointments
                .Include(a => a.User)
                .FirstOrDefaultAsync(a => a.Id == req.AppointmentId
                    && a.ServiceProviderProfileId == profile.Id);

            if (appointment == null) return NotFound("Appointment not found");

            var existing = await _db.Sessions
                .FirstOrDefaultAsync(s => s.AppointmentId == req.AppointmentId);
            if (existing != null) return BadRequest("Session already exists for this appointment");

            var session = new Session
            {
                AppointmentId = req.AppointmentId,
                StartedAt = DateTimeOffset.UtcNow,
                Summary = req.Summary.Trim(),
                Status = SessionStatus.InProgress
            };

            _db.Sessions.Add(session);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                session.Id,
                session.AppointmentId,
                session.Summary,
                session.StartedAt,
                session.Status,
                UserName = appointment.User.FullName ?? appointment.User.Email
            });
        }
        public record UpdateSessionRequest(
            string? Summary,
            string? Notes,
            string? Outcome,
            string? ActionItems,
            DateOnly? NextSessionDate,
            string? NextSessionNotes,
            string? ProviderPrivateNotes
        );
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSession(int id, [FromBody] UpdateSessionRequest req)
        {
            var profile = await GetMyProfile();
            if (profile == null) return NotFound("Provider profile not found");

            var session = await _db.Sessions
                .Include(s => s.Appointment)
                .FirstOrDefaultAsync(s => s.Id == id
                    && s.Appointment.ServiceProviderProfileId == profile.Id);

            if (session == null) return NotFound("Session not found");
            if (session.Status == SessionStatus.Completed)
                return BadRequest("Cannot update completed session");

            if (!string.IsNullOrWhiteSpace(req.Summary))
            {
                if (req.Summary.Length > 500)
                    return BadRequest("Summary must be at most 500 characters");
                session.Summary = req.Summary.Trim();
            }
            if (req.Notes != null)
            {
                if (req.Notes.Length > 2000)
                    return BadRequest("Notes must be at most 2000 characters");
                session.Notes = req.Notes.Trim();
            }
            if (req.Outcome != null)
            {
                if (req.Outcome.Length > 2000)
                    return BadRequest("Outcome must be at most 2000 characters");
                session.Outcome = req.Outcome.Trim();
            }
            if (req.ActionItems != null)
            {
                if (req.ActionItems.Length > 2000)
                    return BadRequest("Action items must be at most 2000 characters");
                session.ActionItems = req.ActionItems.Trim();
            }
            if (req.NextSessionDate.HasValue)
                session.NextSessionDate = req.NextSessionDate;
            if (req.NextSessionNotes != null)
            {
                if (req.NextSessionNotes.Length > 1000)
                    return BadRequest("Next session notes must be at most 1000 characters");
                session.NextSessionNotes = req.NextSessionNotes.Trim();
            }
            if (req.ProviderPrivateNotes != null)
            {
                if (req.ProviderPrivateNotes.Length > 2000)
                    return BadRequest("Provider private notes must be at most 2000 characters");
                session.ProviderPrivateNotes = req.ProviderPrivateNotes.Trim();
            }

            await _db.SaveChangesAsync();
            return Ok(session);
        }

        public record CompleteSessionRequest(
            string Summary,
            string? Notes,
            string? Outcome,
            string? ActionItems,
            DateOnly? NextSessionDate,
            string? NextSessionNotes,
            string? ProviderPrivateNotes
        );
        [HttpPost("{id}/complete")]
        public async Task<IActionResult> CompleteSession(int id, [FromBody] CompleteSessionRequest req)
        {
            if (id <= 0)
            {
                return BadRequest("Invalid session ID");
            }
            
            if (string.IsNullOrWhiteSpace(req.Summary))
            {
                return BadRequest("Summary is required");
            }
            
            if (req.Summary.Length > 500)
                return BadRequest("Summary must be at most 500 characters");
            if (req.Notes != null && req.Notes.Length > 2000)
                return BadRequest("Notes must be at most 2000 characters");
            if (req.Outcome != null && req.Outcome.Length > 2000)
                return BadRequest("Outcome must be at most 2000 characters");
            if (req.ActionItems != null && req.ActionItems.Length > 2000)
                return BadRequest("Action items must be at most 2000 characters");
            if (req.NextSessionNotes != null && req.NextSessionNotes.Length > 1000)
                return BadRequest("Next session notes must be at most 1000 characters");
            if (req.ProviderPrivateNotes != null && req.ProviderPrivateNotes.Length > 2000)
                return BadRequest("Provider private notes must be at most 2000 characters");
            
            var profile = await GetMyProfile();
            if (profile == null) return NotFound("Provider profile not found");

            var session = await _db.Sessions
                .Include(s => s.Appointment)
                .FirstOrDefaultAsync(s => s.Id == id
                    && s.Appointment.ServiceProviderProfileId == profile.Id);

            if (session == null) return NotFound("Session not found");
            if (session.Status == SessionStatus.Completed)
                return BadRequest("Session already completed");

            session.Summary = req.Summary.Trim();
            session.Notes = req.Notes?.Trim();
            session.Outcome = req.Outcome?.Trim();
            session.ActionItems = req.ActionItems?.Trim();
            session.NextSessionDate = req.NextSessionDate;
            session.NextSessionNotes = req.NextSessionNotes?.Trim();
            session.ProviderPrivateNotes = req.ProviderPrivateNotes?.Trim();
            session.CompletedAt = DateTimeOffset.UtcNow;
            session.Status = SessionStatus.Completed;

            await _db.SaveChangesAsync();
            return Ok(session);
        }

        [HttpGet]
        public async Task<IActionResult> GetMySessions()
        {
            var profile = await GetMyProfile();
            if (profile == null) return NotFound("Provider profile not found");

            var sessions = await _db.Sessions
                .Include(s => s.Appointment)
                    .ThenInclude(a => a.User)
                .Where(s => s.Appointment.ServiceProviderProfileId == profile.Id)
                .OrderByDescending(s => s.StartedAt)
                .Select(s => new
                {
                    s.Id,
                    s.AppointmentId,
                    s.Summary,
                    s.Notes,
                    s.Outcome,
                    s.ActionItems,
                    s.NextSessionDate,
                    s.NextSessionNotes,
                    s.ProviderPrivateNotes,
                    s.StartedAt,
                    s.CompletedAt,
                    s.Status,
                    UserName = s.Appointment.User.FullName ?? s.Appointment.User.Email,
                    AppointmentDate = s.Appointment.Date,
                    AppointmentTime = s.Appointment.StartTime
                })
                .ToListAsync();

            return Ok(sessions);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetSession(int id)
        {
            var profile = await GetMyProfile();
            if (profile == null) return NotFound("Provider profile not found");

            var session = await _db.Sessions
                .Include(s => s.Appointment)
                    .ThenInclude(a => a.User)
                .Where(s => s.Id == id && s.Appointment.ServiceProviderProfileId == profile.Id)
                .Select(s => new
                {
                    s.Id,
                    s.AppointmentId,
                    s.Summary,
                    s.Notes,
                    s.Outcome,
                    s.ActionItems,
                    s.NextSessionDate,
                    s.NextSessionNotes,
                    s.ProviderPrivateNotes,
                    s.StartedAt,
                    s.CompletedAt,
                    s.Status,
                    User = new
                    {
                        s.Appointment.User.Id,
                        Name = s.Appointment.User.FullName ?? s.Appointment.User.Email,
                        s.Appointment.User.Email,
                        s.Appointment.User.PhoneNumber
                    },
                    Appointment = new
                    {
                        s.Appointment.Date,
                        s.Appointment.StartTime,
                        s.Appointment.EndTime
                    }
                })
                .FirstOrDefaultAsync();

            if (session == null) return NotFound("Session not found");
            return Ok(session);
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelSession(int id)
        {
            var profile = await GetMyProfile();
            if (profile == null) return NotFound("Provider profile not found");

            var session = await _db.Sessions
                .Include(s => s.Appointment)
                .FirstOrDefaultAsync(s => s.Id == id
                    && s.Appointment.ServiceProviderProfileId == profile.Id);

            if (session == null) return NotFound("Session not found");
            if (session.Status == SessionStatus.Completed)
                return BadRequest("Cannot cancel completed session");

            session.Status = SessionStatus.Cancelled;
            session.CompletedAt = DateTimeOffset.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(session);
        }
    }
}
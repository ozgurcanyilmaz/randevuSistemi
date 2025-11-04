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
                Summary = req.Summary,
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
                session.Summary = req.Summary;
            if (req.Notes != null)
                session.Notes = req.Notes;
            if (req.Outcome != null)
                session.Outcome = req.Outcome;
            if (req.ActionItems != null)
                session.ActionItems = req.ActionItems;
            if (req.NextSessionDate.HasValue)
                session.NextSessionDate = req.NextSessionDate;
            if (req.NextSessionNotes != null)
                session.NextSessionNotes = req.NextSessionNotes;
            if (req.ProviderPrivateNotes != null)
                session.ProviderPrivateNotes = req.ProviderPrivateNotes;

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
            var profile = await GetMyProfile();
            if (profile == null) return NotFound("Provider profile not found");

            var session = await _db.Sessions
                .Include(s => s.Appointment)
                .FirstOrDefaultAsync(s => s.Id == id
                    && s.Appointment.ServiceProviderProfileId == profile.Id);

            if (session == null) return NotFound("Session not found");
            if (session.Status == SessionStatus.Completed)
                return BadRequest("Session already completed");

            session.Summary = req.Summary;
            session.Notes = req.Notes;
            session.Outcome = req.Outcome;
            session.ActionItems = req.ActionItems;
            session.NextSessionDate = req.NextSessionDate;
            session.NextSessionNotes = req.NextSessionNotes;
            session.ProviderPrivateNotes = req.ProviderPrivateNotes;
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
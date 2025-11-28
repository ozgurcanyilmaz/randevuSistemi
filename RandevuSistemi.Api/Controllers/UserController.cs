using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RandevuSistemi.Api.Data;
using RandevuSistemi.Api.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;

namespace RandevuSistemi.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;
        public UserController(AppDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        private async Task<bool> IsOperator()
        {
            if (!User.Identity?.IsAuthenticated ?? true) return false;
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return false;
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return false;
            return await _userManager.IsInRoleAsync(user, "Operator");
        }

        private async Task<OperatorProfile?> GetOperatorProfile()
        {
            if (!User.Identity?.IsAuthenticated ?? true) return null;
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return null;
            return await _db.OperatorProfiles
                .Include(op => op.Branch)
                .FirstOrDefaultAsync(op => op.UserId == userId);
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();
            var u = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId);
            if (u == null) return NotFound();
            return Ok(new
            {
                u.Email,
                u.FullName,
                u.PhoneNumber,
                u.TcKimlikNo,
                u.Gender,
                u.Address,
                u.HeightCm,
                u.WeightKg
            });
        }

        public record UpdateProfileRequest(string? FullName, string? PhoneNumber, string? TcKimlikNo, string? Gender, string? Address, int? HeightCm, int? WeightKg);
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();
            var u = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId);
            if (u == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(request.TcKimlikNo) && request.TcKimlikNo.Length != 11)
            {
                return BadRequest("TC Kimlik No 11 haneli olmalıdır.");
            }
            if (!string.IsNullOrWhiteSpace(request.Gender))
            {
                var allowed = new[] { "Erkek", "Kadın", "Diğer" };
                if (!allowed.Contains(request.Gender))
                {
                    return BadRequest("Geçersiz cinsiyet değeri.");
                }
            }
            if (request.HeightCm is not null && request.HeightCm < 0)
            {
                return BadRequest("Boy negatif olamaz.");
            }
            if (request.WeightKg is not null && request.WeightKg < 0)
            {
                return BadRequest("Kilo negatif olamaz.");
            }
            if (!string.IsNullOrWhiteSpace(request.PhoneNumber) && request.PhoneNumber.Length < 10)
            {
                return BadRequest("Telefon numarası en az 10 haneli olmalıdır.");
            }

            var nextFullName = string.IsNullOrWhiteSpace(request.FullName) ? u.FullName : request.FullName;
            if (string.IsNullOrWhiteSpace(nextFullName))
            {
                return BadRequest("Ad Soyad zorunludur.");
            }
            u.FullName = nextFullName;
            u.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber;
            u.TcKimlikNo = string.IsNullOrWhiteSpace(request.TcKimlikNo) ? null : request.TcKimlikNo;
            u.Gender = string.IsNullOrWhiteSpace(request.Gender) ? null : request.Gender;
            u.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address;
            u.HeightCm = request.HeightCm;
            u.WeightKg = request.WeightKg;

            await _db.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("departments")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDepartments()
        {
            if (await IsOperator())
            {
                var operatorProfile = await GetOperatorProfile();
                if (operatorProfile == null)
                {
                    return Unauthorized("Operator profile not found. Please contact admin to assign you to a branch.");
                }

                var branch = operatorProfile.Branch;
                var department = await _db.Departments
                    .Include(d => d.Branches)
                    .FirstOrDefaultAsync(d => d.Id == branch.DepartmentId);

                if (department == null)
                {
                    return NotFound("Department not found");
                }

                var filteredDepartment = new
                {
                    department.Id,
                    department.Name,
                    Branches = department.Branches.Where(b => b.Id == branch.Id).Select(b => new { b.Id, b.Name }).ToList()
                };

                return Ok(new[] { filteredDepartment });
            }

            var data = await _db.Departments.Include(d => d.Branches).ToListAsync();
            return Ok(data);
        }

        [HttpGet("branches/{branchId}/providers")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProvidersByBranch(int branchId)
        {
            if (await IsOperator())
            {
                var operatorProfile = await GetOperatorProfile();
                if (operatorProfile == null)
                {
                    return Unauthorized("Operator profile not found. Please contact admin to assign you to a branch.");
                }

                if (operatorProfile.BranchId != branchId)
                {
                    return BadRequest("You can only access providers from your assigned branch.");
                }
            }

            var providers = await _db.ServiceProviderProfiles
                .Include(p => p.User)
                .Where(p => p.BranchId == branchId)
                .ToListAsync();
            return Ok(providers.Select(p => new { p.Id, p.User.FullName, p.User.Email, p.SessionDurationMinutes }));
        }

        [HttpGet("providers/{providerId:int}/slots")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAvailableSlots(int providerId, [FromQuery] DateOnly date)
        {
            var provider = await _db.ServiceProviderProfiles
                .Include(p => p.WorkingHours)
                .Include(p => p.BreakPeriods)
                .Include(p => p.Appointments)
                .FirstOrDefaultAsync(p => p.Id == providerId);
            if (provider == null) return NotFound();

            var day = date.DayOfWeek;
            var work = provider.WorkingHours.Where(w => w.DayOfWeek == day).ToList();
            if (!work.Any()) return Ok(Array.Empty<object>());

            var breaks = provider.BreakPeriods.Where(b => b.DayOfWeek == day).ToList();
            var existing = provider.Appointments.Where(a => a.Date == date).ToList();

            var session = TimeSpan.FromMinutes(provider.SessionDurationMinutes);
            var slots = new List<object>();
            var isToday = date == DateOnly.FromDateTime(DateTime.Now);
            var nowTime = TimeOnly.FromDateTime(DateTime.Now);
            foreach (var w in work)
            {
                var start = w.StartTime;
                while (start < w.EndTime)
                {
                    var end = start.AddMinutes(provider.SessionDurationMinutes);
                    if (end > w.EndTime) break;

                    bool overlapsBreak = breaks.Any(b => !(end <= b.StartTime || start >= b.EndTime));
                    bool taken = existing.Any(a => !(end <= a.StartTime || start >= a.EndTime));
                    bool inPastToday = isToday && start <= nowTime;
                    if (!overlapsBreak && !taken && !inPastToday)
                    {
                        slots.Add(new { Start = start, End = end });
                    }
                    start = end;
                }
            }
            return Ok(slots);
        }

        public record BookRequest(int ProviderId, DateOnly Date, TimeOnly Start, TimeOnly End, string? Notes);
        [HttpPost("appointments")]
        public async Task<IActionResult> Book([FromBody] BookRequest req)
        {
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
            if (provider == null) return NotFound();

            var expected = TimeSpan.FromMinutes(provider.SessionDurationMinutes);
            var actual = req.End.ToTimeSpan() - req.Start.ToTimeSpan();
            if (actual != expected)
            {
                return BadRequest($"Invalid session length. Expected {provider.SessionDurationMinutes} minutes.");
            }

            var workForDay = await _db.WorkingHours.Where(w => w.ServiceProviderProfileId == provider.Id && w.DayOfWeek == req.Date.DayOfWeek).ToListAsync();
            if (!workForDay.Any()) return BadRequest("Provider has no working hours on selected day.");

            bool insideWorking = workForDay.Any(w => req.Start >= w.StartTime && req.End <= w.EndTime);
            if (!insideWorking) return BadRequest("Selected time is outside working hours.");

            var breaksForDay = await _db.BreakPeriods.Where(b => b.ServiceProviderProfileId == provider.Id && b.DayOfWeek == req.Date.DayOfWeek).ToListAsync();
            bool overlapsBreak = breaksForDay.Any(b => !(req.End <= b.StartTime || req.Start >= b.EndTime));
            if (overlapsBreak) return BadRequest("Selected time overlaps a break period.");

            bool conflict = provider.Appointments.Any(a => a.Date == req.Date && !(req.End <= a.StartTime || req.Start >= a.EndTime));
            if (conflict) return Conflict("Slot already taken");

            var userId = User.Identity?.IsAuthenticated == true ? User.Claims.First(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier).Value : null;
            if (userId == null) return Unauthorized();

            var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId);
            if (user == null) return Unauthorized();
            bool profileComplete = !string.IsNullOrWhiteSpace(user.FullName)
                && !string.IsNullOrWhiteSpace(user.PhoneNumber)
                && !string.IsNullOrWhiteSpace(user.TcKimlikNo)
                && !string.IsNullOrWhiteSpace(user.Gender)
                && !string.IsNullOrWhiteSpace(user.Address);
            if (!profileComplete)
            {
                return BadRequest("Profilinizdeki gerekli bilgileri tamamlayın: Telefon, TC Kimlik No, Cinsiyet, Adres.");
            }

            var appt = new Appointment
            {
                ServiceProviderProfileId = req.ProviderId,
                UserId = userId,
                Date = req.Date,
                StartTime = req.Start,
                EndTime = req.End,
                Notes = req.Notes
            };
            _db.Appointments.Add(appt);
            await _db.SaveChangesAsync();
            return Ok(appt);
        }

        [HttpGet("appointments")]
        public async Task<IActionResult> GetMyAppointments()
        {
            var userId = User.Claims.First(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier).Value;
            var appts = await _db.Appointments
                .Include(a => a.ServiceProvider).ThenInclude(sp => sp.Branch)
                .Include(a => a.ServiceProvider).ThenInclude(sp => sp.User)
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.Date).ThenByDescending(a => a.StartTime)
                .Select(a => new
                {
                    a.Id,
                    a.Date,
                    a.StartTime,
                    a.EndTime,
                    ProviderId = a.ServiceProviderProfileId,
                    ProviderName = a.ServiceProvider.User.FullName ?? a.ServiceProvider.User.Email,
                    BranchName = a.ServiceProvider.Branch.Name,
                    a.ProviderNotes
                })
                .ToListAsync();
            return Ok(appts);
        }

        [HttpGet("sessions")]
        public async Task<IActionResult> GetMySessions()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var sessions = await _db.Sessions
                .Include(s => s.Appointment)
                    .ThenInclude(a => a.ServiceProvider)
                        .ThenInclude(sp => sp.Branch)
                .Where(s => s.Appointment.UserId == userId && s.Status == SessionStatus.Completed)
                .OrderByDescending(s => s.CompletedAt)
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
                    s.CompletedAt,
                    Provider = new
                    {
                        Name = s.Appointment.ServiceProvider.User.FullName ?? s.Appointment.ServiceProvider.User.Email,
                        BranchName = s.Appointment.ServiceProvider.Branch.Name
                    },
                    Appointment = new
                    {
                        Id = s.Appointment.Id,
                        s.Appointment.Date,
                        s.Appointment.StartTime,
                        s.Appointment.EndTime
                    }
                })
                .ToListAsync();

            return Ok(sessions);
        }

        [HttpGet("sessions/{id}")]
        public async Task<IActionResult> GetSessionDetail(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var session = await _db.Sessions
                .Include(s => s.Appointment)
                    .ThenInclude(a => a.ServiceProvider)
                        .ThenInclude(sp => sp.Branch)
                .Where(s => s.Id == id
                    && s.Appointment.UserId == userId
                    && s.Status == SessionStatus.Completed)
                .Select(s => new
                {
                    s.Id,
                    s.Summary,
                    s.Notes,
                    s.Outcome,
                    s.ActionItems,
                    s.NextSessionDate,
                    s.NextSessionNotes,
                    s.CompletedAt,
                    Provider = new
                    {
                        Name = s.Appointment.ServiceProvider.User.FullName ?? s.Appointment.ServiceProvider.User.Email,
                        BranchName = s.Appointment.ServiceProvider.Branch.Name
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

        [HttpDelete("appointments/{id}")]
        public async Task<IActionResult> CancelAppointment(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var appointment = await _db.Appointments
                .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

            if (appointment == null)
                return NotFound("Randevu bulunamadı.");

            var appointmentDateTime = appointment.Date.ToDateTime(appointment.StartTime);
            if (appointmentDateTime < DateTime.Now)
                return BadRequest("Geçmiş randevular iptal edilemez.");

            _db.Appointments.Remove(appointment);
            await _db.SaveChangesAsync();

            return Ok(new { Message = "Randevu başarıyla iptal edildi." });
        }
    }
}

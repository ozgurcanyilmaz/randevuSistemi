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
    [Authorize(Roles = "Operator")]
    public class OperatorController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public OperatorController(AppDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var today = DateOnly.FromDateTime(DateTime.Now);
            var startOfWeek = today.AddDays(-(int)today.DayOfWeek);
            var startOfMonth = new DateOnly(today.Year, today.Month, 1);

            // Today's stats
            var todayAppointments = await _db.Appointments
                .Where(a => a.Date == today)
                .ToListAsync();

            var todayCheckedIn = todayAppointments.Count(a => a.CheckedInAt != null);
            var todayPending = todayAppointments.Count(a => a.CheckedInAt == null);

            // This week's stats
            var weekAppointments = await _db.Appointments
                .Where(a => a.Date >= startOfWeek && a.Date <= today)
                .ToListAsync();

            var weekCheckedIn = weekAppointments.Count(a => a.CheckedInAt != null);
            var weekTotal = weekAppointments.Count;

            // This month's stats
            var monthAppointments = await _db.Appointments
                .Where(a => a.Date >= startOfMonth && a.Date <= today)
                .ToListAsync();

            var monthCheckedIn = monthAppointments.Count(a => a.CheckedInAt != null);
            var monthTotal = monthAppointments.Count;

            // Provider stats for today
            var providerStats = await _db.Appointments
                .Where(a => a.Date == today)
                .Include(a => a.ServiceProvider)
                    .ThenInclude(sp => sp.User)
                .Include(a => a.ServiceProvider)
                    .ThenInclude(sp => sp.Branch)
                .GroupBy(a => new
                {
                    ProviderId = a.ServiceProviderProfileId,
                    ProviderName = a.ServiceProvider.User.FullName ?? a.ServiceProvider.User.Email,
                    BranchName = a.ServiceProvider.Branch.Name
                })
                .Select(g => new
                {
                    g.Key.ProviderId,
                    g.Key.ProviderName,
                    g.Key.BranchName,
                    Total = g.Count(),
                    CheckedIn = g.Count(a => a.CheckedInAt != null),
                    Pending = g.Count(a => a.CheckedInAt == null)
                })
                .OrderByDescending(x => x.Total)
                .ToListAsync();

            // Recent check-ins (last 10)
            var recentCheckIns = await _db.Appointments
                .Where(a => a.CheckedInAt != null && a.Date == today)
                .Include(a => a.User)
                .Include(a => a.ServiceProvider)
                    .ThenInclude(sp => sp.Branch)
                .OrderByDescending(a => a.CheckedInAt)
                .Take(10)
                .Select(a => new
                {
                    a.Id,
                    a.Date,
                    a.StartTime,
                    a.EndTime,
                    UserName = a.User.FullName ?? a.User.Email,
                    BranchName = a.ServiceProvider.Branch.Name,
                    a.CheckedInAt
                })
                .ToListAsync();

            // Hourly distribution for today
            var hourlyStats = todayAppointments
                .GroupBy(a => a.StartTime.Hour)
                .Select(g => new
                {
                    Hour = g.Key,
                    Count = g.Count(),
                    CheckedIn = g.Count(a => a.CheckedInAt != null)
                })
                .OrderBy(x => x.Hour)
                .ToList();

            return Ok(new
            {
                Today = new
                {
                    Total = todayAppointments.Count,
                    CheckedIn = todayCheckedIn,
                    Pending = todayPending,
                    CheckInRate = todayAppointments.Count > 0
                        ? Math.Round((double)todayCheckedIn / todayAppointments.Count * 100, 1)
                        : 0
                },
                Week = new
                {
                    Total = weekTotal,
                    CheckedIn = weekCheckedIn,
                    CheckInRate = weekTotal > 0
                        ? Math.Round((double)weekCheckedIn / weekTotal * 100, 1)
                        : 0
                },
                Month = new
                {
                    Total = monthTotal,
                    CheckedIn = monthCheckedIn,
                    CheckInRate = monthTotal > 0
                        ? Math.Round((double)monthCheckedIn / monthTotal * 100, 1)
                        : 0
                },
                ProviderStats = providerStats,
                RecentCheckIns = recentCheckIns,
                HourlyStats = hourlyStats
            });
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

            var expected = TimeSpan.FromMinutes(provider.SessionDurationMinutes);
            var actual = req.End.ToTimeSpan() - req.Start.ToTimeSpan();
            if (actual != expected) return BadRequest($"Invalid session length. Expected {provider.SessionDurationMinutes} minutes.");

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

        public record CreateWalkInRequest(
            string FullName,
            string TcKimlikNo,
            string PhoneNumber,
            string Gender,
            string Address,
            int? HeightCm,
            int? WeightKg,
            int ProviderId,
            string? Notes
        );

        [HttpPost("appointments/walk-in")]
        public async Task<IActionResult> CreateWalkInAppointment([FromBody] CreateWalkInRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.FullName) || req.FullName.Length < 2)
                return BadRequest("Ad Soyad en az 2 karakter olmalıdır.");

            if (string.IsNullOrWhiteSpace(req.TcKimlikNo) || req.TcKimlikNo.Length != 11)
                return BadRequest("TC Kimlik No 11 haneli olmalıdır.");

            if (string.IsNullOrWhiteSpace(req.PhoneNumber) || req.PhoneNumber.Length < 10)
                return BadRequest("Telefon numarası en az 10 haneli olmalıdır.");

            if (string.IsNullOrWhiteSpace(req.Gender) || !new[] { "Erkek", "Kadın", "Diğer" }.Contains(req.Gender))
                return BadRequest("Geçerli bir cinsiyet seçiniz.");

            if (string.IsNullOrWhiteSpace(req.Address) || req.Address.Length < 5)
                return BadRequest("Adres en az 5 karakter olmalıdır.");

            if (req.HeightCm.HasValue && req.HeightCm < 0)
                return BadRequest("Boy negatif olamaz.");

            if (req.WeightKg.HasValue && req.WeightKg < 0)
                return BadRequest("Kilo negatif olamaz.");

            var provider = await _db.ServiceProviderProfiles.Include(p => p.Appointments).FirstOrDefaultAsync(p => p.Id == req.ProviderId);
            if (provider == null) return NotFound("Provider not found");

            var existingUser = await _userManager.Users.FirstOrDefaultAsync(u => u.TcKimlikNo == req.TcKimlikNo);

            ApplicationUser user;
            if (existingUser != null)
            {
                user = existingUser;
                user.FullName = req.FullName;
                user.PhoneNumber = req.PhoneNumber;
                user.Gender = req.Gender;
                user.Address = req.Address;
                user.HeightCm = req.HeightCm;
                user.WeightKg = req.WeightKg;
                await _userManager.UpdateAsync(user);
            }
            else
            {
                var walkInEmail = $"walkin_{req.TcKimlikNo}@system.local";
                user = new ApplicationUser
                {
                    UserName = walkInEmail,
                    Email = walkInEmail,
                    EmailConfirmed = true,
                    FullName = req.FullName,
                    TcKimlikNo = req.TcKimlikNo,
                    PhoneNumber = req.PhoneNumber,
                    Gender = req.Gender,
                    Address = req.Address,
                    HeightCm = req.HeightCm,
                    WeightKg = req.WeightKg
                };

                var result = await _userManager.CreateAsync(user, $"WalkIn_{req.TcKimlikNo}_2024!");
                if (!result.Succeeded)
                {
                    return BadRequest(result.Errors);
                }

                await _userManager.AddToRoleAsync(user, "User");
            }

            var now = DateTimeOffset.UtcNow;
            var today = DateOnly.FromDateTime(DateTime.Now);

            var futureTime = DateTime.Now.AddMinutes(10);
            var currentMinutes = futureTime.Minute;
            var roundedMinutes = (currentMinutes / 5) * 5;
            var startTime = new TimeOnly(futureTime.Hour, roundedMinutes);
            var endTime = startTime.AddMinutes(provider.SessionDurationMinutes);

            var appt = new Appointment
            {
                ServiceProviderProfileId = req.ProviderId,
                UserId = user.Id,
                Date = today,
                StartTime = startTime,
                EndTime = endTime,
                Notes = req.Notes ?? "Walk-in randevu",
                CheckedInAt = now
            };
            _db.Appointments.Add(appt);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                AppointmentId = appt.Id,
                UserId = user.Id,
                UserFullName = user.FullName,
                CheckedInAt = appt.CheckedInAt,
                Message = existingUser != null ? "Mevcut kullanıcı için walk-in randevu oluşturuldu ve onaylandı" : "Yeni kullanıcı kaydedildi ve walk-in randevu oluşturuldu"
            });
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string? q)
        {
            var roleId = await _db.Roles
                .Where(r => r.Name == "User")
                .Select(r => r.Id)
                .FirstOrDefaultAsync();

            if (roleId == null) return Ok(Array.Empty<object>());

            var usersQuery = _db.Users
                .Where(u => _db.UserRoles.Any(ur => ur.UserId == u.Id && ur.RoleId == roleId));

            if (!string.IsNullOrWhiteSpace(q))
            {
                var ql = q.ToLower();
                usersQuery = usersQuery.Where(u =>
                    (u.FullName != null && u.FullName.ToLower().Contains(ql)) ||
                    (u.Email != null && u.Email.ToLower().Contains(ql)));
            }

            var users = await usersQuery
                .OrderBy(u => u.FullName ?? u.Email)
                .Select(u => new { u.Id, u.Email, u.FullName })
                .Take(50)
                .ToListAsync();

            return Ok(users);
        }
    }
}
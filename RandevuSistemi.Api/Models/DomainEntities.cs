namespace RandevuSistemi.Api.Models
{
    public class Department
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public ICollection<Branch> Branches { get; set; } = new List<Branch>();
    }

    public class Branch
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int DepartmentId { get; set; }
        public Department Department { get; set; } = null!;

        public ICollection<ServiceProviderProfile> ServiceProviders { get; set; } = new List<ServiceProviderProfile>();
    }

    public class ServiceProviderProfile
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;

        public int BranchId { get; set; }
        public Branch Branch { get; set; } = null!;

        public int SessionDurationMinutes { get; set; } = 30; // default

        public ICollection<WorkingHours> WorkingHours { get; set; } = new List<WorkingHours>();
        public ICollection<BreakPeriod> BreakPeriods { get; set; } = new List<BreakPeriod>();
        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    }

    public class WorkingHours
    {
        public int Id { get; set; }
        public int ServiceProviderProfileId { get; set; }
        public ServiceProviderProfile ServiceProvider { get; set; } = null!;
        public DayOfWeek DayOfWeek { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
    }

    public class BreakPeriod
    {
        public int Id { get; set; }
        public int ServiceProviderProfileId { get; set; }
        public ServiceProviderProfile ServiceProvider { get; set; } = null!;
        public DayOfWeek DayOfWeek { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
    }

    public class Appointment
    {
        public int Id { get; set; }
        public int ServiceProviderProfileId { get; set; }
        public ServiceProviderProfile ServiceProvider { get; set; } = null!;

        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;

        public DateOnly Date { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public string? Notes { get; set; }
        public string? ProviderNotes { get; set; }

        public DateTimeOffset? CheckedInAt { get; set; }
    }
}
namespace RandevuSistemi.Api.Models
{
    public class Session
    {
        public int Id { get; set; }

        public int AppointmentId { get; set; }
        public Appointment Appointment { get; set; } = null!;

        public DateTimeOffset StartedAt { get; set; }
        public DateTimeOffset? CompletedAt { get; set; }

        public string Summary { get; set; } = string.Empty; 
        public string? Notes { get; set; } 
        public string? Outcome { get; set; } 
        public string? ActionItems { get; set; } 

        public DateOnly? NextSessionDate { get; set; }
        public string? NextSessionNotes { get; set; }

        public SessionStatus Status { get; set; }

        public string? ProviderPrivateNotes { get; set; }
    }

    public enum SessionStatus
    {
        InProgress = 0,  
        Completed = 1,   
        Cancelled = 2,   
        NoShow = 3       
    }
}
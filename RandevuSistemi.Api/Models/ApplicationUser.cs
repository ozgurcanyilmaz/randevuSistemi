using Microsoft.AspNetCore.Identity;

namespace RandevuSistemi.Api.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string? FullName { get; set; }
        // User profile fields
        public string? TcKimlikNo { get; set; }
        public string? Gender { get; set; }
        public string? Address { get; set; }
        public int? HeightCm { get; set; }
        public int? WeightKg { get; set; }
    }
}




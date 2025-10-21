using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RandevuSistemi.Api.Models;

namespace RandevuSistemi.Api.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Department> Departments => Set<Department>();
        public DbSet<Branch> Branches => Set<Branch>();
        public DbSet<ServiceProviderProfile> ServiceProviderProfiles => Set<ServiceProviderProfile>();
        public DbSet<WorkingHours> WorkingHours => Set<WorkingHours>();
        public DbSet<BreakPeriod> BreakPeriods => Set<BreakPeriod>();
        public DbSet<Appointment> Appointments => Set<Appointment>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<Department>()
                .HasMany(d => d.Branches)
                .WithOne(b => b.Department)
                .HasForeignKey(b => b.DepartmentId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Branch>()
                .HasMany(b => b.ServiceProviders)
                .WithOne(sp => sp.Branch)
                .HasForeignKey(sp => sp.BranchId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ServiceProviderProfile>()
                .HasOne(sp => sp.User)
                .WithMany()
                .HasForeignKey(sp => sp.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<WorkingHours>()
                .HasOne(w => w.ServiceProvider)
                .WithMany(sp => sp.WorkingHours)
                .HasForeignKey(w => w.ServiceProviderProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<BreakPeriod>()
                .HasOne(b => b.ServiceProvider)
                .WithMany(sp => sp.BreakPeriods)
                .HasForeignKey(b => b.ServiceProviderProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Appointment>()
                .HasOne(a => a.ServiceProvider)
                .WithMany(sp => sp.Appointments)
                .HasForeignKey(a => a.ServiceProviderProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Appointment>()
                .HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}








using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using RandevuSistemi.Api.Models;

namespace RandevuSistemi.Api.Data
{
    public static class SeedData
    {
        public static async Task SeedAsync(IServiceProvider services, IConfiguration configuration)
        {
            var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

            var roles = new[] { "Admin", "Operator", "ServiceProvider", "User" };
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }

            var adminEmail = "admin@gmail.com";
            var adminPassword = "admin";
            var admin = await userManager.Users.FirstOrDefaultAsync(u => u.Email == adminEmail);
            if (admin == null)
            {
                admin = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    EmailConfirmed = true,
                    FullName = "System Admin"
                };
                var result = await userManager.CreateAsync(admin, adminPassword);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(admin, "Admin");
                }
            }

            var operatorEmail = "operator@gmail.com";
            var operatorPassword = "operator";
            var operatorUser = await userManager.Users.FirstOrDefaultAsync(u => u.Email == operatorEmail);
            if (operatorUser == null)
            {
                operatorUser = new ApplicationUser
                {
                    UserName = operatorEmail,
                    Email = operatorEmail,
                    EmailConfirmed = true,
                    FullName = "System Operator"
                };
                var result = await userManager.CreateAsync(operatorUser, operatorPassword);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(operatorUser, "Operator");
                }
            }
        }
    }
}

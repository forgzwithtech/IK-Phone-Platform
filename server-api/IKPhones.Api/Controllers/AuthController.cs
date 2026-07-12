using IKPhones.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System;
using System.Threading.Tasks;

namespace IKPhones.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IKPhonesDbContext _dbContext;
    private readonly IConfiguration _configuration;

    public AuthController(IKPhonesDbContext dbContext, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.ToLower());
        
        if (user == null || !user.IsActive) 
            return Unauthorized("Invalid credentials or account suspended.");

        // Hash the incoming password and compare it to the DB hash
        if (user.PasswordHash != HashPassword(request.Password))
            return Unauthorized("Invalid credentials.");

        // Mint the JWT Token
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"] ?? "IKPhonesSuperSecretKeyForDevelopmentOnly12345!");
        
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("FullName", user.FullName)
            }),
            Expires = DateTime.UtcNow.AddDays(7), // Token lasts 7 days
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);

        return Ok(new
        {
            Token = tokenHandler.WriteToken(token),
            Role = user.Role,
            FullName = user.FullName
        });
    }

    // Helper method to hash passwords securely without heavy external dependencies
    public static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(password);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }
}

public class LoginRequest
{
    public required string Username { get; set; }
    public required string Password { get; set; }
}
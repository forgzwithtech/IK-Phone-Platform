using Microsoft.EntityFrameworkCore;
using IKPhones.Infrastructure.Data;
using IKPhones.Application.Interfaces;
using IKPhones.Application.Services;
using IKPhones.Infrastructure.Workers;
using IKPhones.Api.Hubs;
using IKPhones.API.Services;
using System.Text.Json.Serialization; 
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using IKPhones.Core.Entities;
using IKPhones.Api.Controllers;
using Supabase;
using IKPhones.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ─── SERVICES CONFIGURATION ─────────────────────────────────────────────

// CORS: Configured for local development + wildcard origins for Vercel preview/production deployments
builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy => policy
        .SetIsOriginAllowed(origin => 
            origin.StartsWith("http://localhost:") || 
            origin.EndsWith(".vercel.app") ||
            origin.Contains("vercel.app"))
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials());
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<IKPhonesDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.MigrationsAssembly("IKPhones.Infrastructure");
        npgsqlOptions.CommandTimeout(60);
    }));

// ─── SUPABASE CLIENT SETUP ───
var supabaseUrl = builder.Configuration["Supabase:Url"] 
    ?? throw new InvalidOperationException("Supabase:Url is not configured.");
var supabaseKey = builder.Configuration["Supabase:Key"] 
    ?? throw new InvalidOperationException("Supabase:Key is not configured.");

builder.Services.AddScoped<Supabase.Client>(_ =>
{
    var options = new SupabaseOptions
    {
        AutoRefreshToken = true,
        AutoConnectRealtime = false
    };
    var client = new Supabase.Client(supabaseUrl, supabaseKey, options);
    client.InitializeAsync().GetAwaiter().GetResult();
    return client;
});

// ─── JWT AUTHENTICATION SETUP ───
var jwtKey = builder.Configuration["Jwt:Key"] ?? "IKPhonesSuperSecretKeyForDevelopmentOnly12345!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtKey)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true
        };
    });

builder.Services.AddScoped<IValuationEngine, ValuationEngine>();
builder.Services.AddScoped<FileUploadService>(); 

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSignalR();
builder.Services.AddScoped<IStockNotifier, SignalRStockNotifier>();
builder.Services.AddHostedService<ReservationCleanupWorker>();

var app = builder.Build();

// ─── MIDDLEWARE PIPELINE ────────────────────────────────────────────────

// Swagger enabled for all environments (including Render Production)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "IKPhones API v1");
    c.RoutePrefix = "swagger";
});

app.UseStaticFiles(); 
app.UseRouting();

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

// Root route handler for basic availability check
app.MapGet("/", () => Results.Ok(new { status = "API is live and healthy", serverTime = DateTime.UtcNow }));

app.MapControllers();
app.MapHub<InventoryHub>("/inventoryHub");

// ─── INITIALIZATION & AUTOMATED SEEDING ─────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<IKPhonesDbContext>();
        await context.Database.MigrateAsync(); 

        // SEED USERS IF NONE EXIST
        if (!await context.Users.AnyAsync())
        {
            context.Users.AddRange(
                new User { Id = Guid.NewGuid(), Username = "admin", PasswordHash = AuthController.HashPassword("admin123"), Role = "Admin", FullName = "Master Admin" },
                new User { Id = Guid.NewGuid(), Username = "staff", PasswordHash = AuthController.HashPassword("staff123"), Role = "Staff", FullName = "Store Staff Alpha" },
                new User { Id = Guid.NewGuid(), Username = "rider", PasswordHash = AuthController.HashPassword("rider123"), Role = "Rider", FullName = "Dispatch Beta" }
            );
            await context.SaveChangesAsync();
            Console.WriteLine("🚀 SUCCESS: Seeded System Users (admin/staff/rider).");
        }

        var brandCount = await context.Brands.CountAsync();
        if (brandCount == 0)
        {
            await DbSeeder.SeedAsync(context);
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred during DB initialization.");
    }
}

app.Run();
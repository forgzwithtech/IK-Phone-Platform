using IKPhones.Core.Entities;
using IKPhones.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization; // Added for security
using Microsoft.EntityFrameworkCore;

namespace IKPhones.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly IKPhonesDbContext _dbContext;

    public CategoriesController(IKPhonesDbContext dbContext) => _dbContext = dbContext;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _dbContext.Categories.ToListAsync());

    [Authorize(Roles = "Admin")] // Critical: Only allow Admin to manage structure
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] string categoryName)
    {
        if (string.IsNullOrWhiteSpace(categoryName)) return BadRequest();

        var slug = categoryName.ToLower().Trim().Replace(" ", "-");
        if (await _dbContext.Categories.AnyAsync(c => c.Slug == slug)) 
            return BadRequest("Category exists.");

        var category = new Category { Name = categoryName.Trim(), Slug = slug };
        _dbContext.Categories.Add(category);
        await _dbContext.SaveChangesAsync();

        return Ok(category);
    }
}
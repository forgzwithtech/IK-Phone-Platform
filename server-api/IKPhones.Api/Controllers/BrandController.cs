using IKPhones.Core.Entities;
using IKPhones.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace IKPhones.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BrandsController : ControllerBase
{
    private readonly IKPhonesDbContext _dbContext;

    public BrandsController(IKPhonesDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        // Fetches all brands and orders them alphabetically
        var brands = await _dbContext.Brands
            .OrderBy(b => b.Name)
            .ToListAsync();
            
        return Ok(brands);
    }
}
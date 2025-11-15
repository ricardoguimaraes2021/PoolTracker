using Microsoft.AspNetCore.Mvc;
using PoolTracker.API.Models;
using PoolTracker.API.Services;

namespace PoolTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WeatherController : ControllerBase
{
    private readonly WeatherService _service;

    public WeatherController(WeatherService service)
    {
        _service = service;
    }

    [HttpGet("current")]
    public async Task<ActionResult<WeatherInfo>> GetCurrentWeather()
    {
        var weather = await _service.GetCurrentWeatherAsync();
        if (weather == null)
            return StatusCode(503, "Falha ao obter dados meteorológicos.");

        return Ok(weather);
    }
}
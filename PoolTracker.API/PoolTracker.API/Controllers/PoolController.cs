using Microsoft.AspNetCore.Mvc;
using PoolTracker.API.Models;
using PoolTracker.API.Services;

namespace PoolTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PoolController : ControllerBase
{
    private readonly PoolService _service;

    public PoolController(PoolService service)
    {
        _service = service;
    }

    [HttpGet("status")]
    public ActionResult<PoolStatus> GetStatus() => Ok(_service.GetStatus());

    [HttpPost("enter")]
    public ActionResult<PoolStatus> Enter() => Ok(_service.Enter());

    [HttpPost("exit")]
    public ActionResult<PoolStatus> Exit() => Ok(_service.Exit());

    [HttpPut("setCount")]
    public ActionResult<PoolStatus> SetCount([FromQuery] int value)
        => Ok(_service.SetCount(value));

    [HttpPut("setCapacity")]
    public ActionResult<PoolStatus> SetCapacity([FromQuery] int value)
        => Ok(_service.SetCapacity(value));

    [HttpPut("setOpenStatus")]
    public ActionResult<PoolStatus> SetOpenStatus([FromQuery] bool isOpen)
        => Ok(_service.SetOpenStatus(isOpen));
}
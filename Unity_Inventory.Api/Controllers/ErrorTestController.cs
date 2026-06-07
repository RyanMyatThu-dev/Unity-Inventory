using Microsoft.AspNetCore.Mvc;
using System;
using Unity_Inventory.Domain.Exceptions;

namespace Unity_Inventory.Api.Controllers
{
    [ApiController]
    [Route("api/errortest")]
    public class ErrorTestController : ControllerBase
    {
        [HttpGet("404")]
        public IActionResult ThrowNotFound()
        {
            throw new NotFoundException("Test resource was not found.");
        }

        [HttpGet("400")]
        public IActionResult ThrowValidation()
        {
            throw new ValidationException("Test validation failed.");
        }

        [HttpGet("500")]
        public IActionResult ThrowInternal()
        {
            throw new InvalidOperationException("Test unhandled system error occurred.");
        }
    }
}

using IMS.Domain.Features.Sales;
using IMS.Domain.Features.Sales.Models;
using IMS.shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace IMS.api.Controllers
{
    [Route("api/sales")]
    [ApiController]
    [Authorize]
    public class SalesController : ControllerBase
    {
        private readonly ISalesService _salesService;

        public SalesController(ISalesService salesService)
        {
            _salesService = salesService;
        }

        private int GetBusinessId()
        {
            var businessIdClaim = User.FindFirst("BusinessId");
            return businessIdClaim != null ? int.Parse(businessIdClaim.Value) : 0;
        }

        [HttpGet("reports")]
        public async Task<IActionResult> GetReports()
        {
            var businessId = GetBusinessId();
            if (businessId == 0) return BadRequest("Business not selected.");

            var result = await _salesService.GetReportsByBusinessIdAsync(businessId);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpGet("reports/{id}")]
        public async Task<IActionResult> GetReport(int id)
        {
            var result = await _salesService.GetReportByIdAsync(id);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("reports")]
        public async Task<IActionResult> CreateReport([FromBody] CreateReportRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var businessId = GetBusinessId();
            if (businessId == 0) return BadRequest("Business not selected.");
            
            request.BusinessId = businessId;

            var result = await _salesService.CreateReportAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("reports/{id}")]
        public async Task<IActionResult> DeleteReport(int id)
        {
            var result = await _salesService.DeleteReportAsync(id);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
    }
}

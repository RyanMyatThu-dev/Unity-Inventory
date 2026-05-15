using Unity_Inventory.Domain.Features.CustomerPrices;
using Unity_Inventory.Domain.Features.CustomerPrices.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Unity_Inventory.Api.Filters;
using System.Security.Claims;

namespace Unity_Inventory.Api.Controllers
{
    [Route("api/customer-prices")]
    [ApiController]
    [Authorize]
    public class CustomerPricesController : ControllerBase
    {
        private readonly ICustomerPriceService _customerPriceService;

        public CustomerPricesController(ICustomerPriceService customerPriceService)
        {
            _customerPriceService = customerPriceService;
        }

        private int GetBusinessId()
        {
            var claim = User.FindFirst("BusinessId");
            return claim != null ? int.Parse(claim.Value) : 0;
        }

        // GET: api/customer-prices/by-customer/{customerId}
        [HttpGet("by-customer/{customerId}")]
        [Permission("customerprices", "view")]
        public async Task<IActionResult> GetByCustomer(int customerId)
        {
            var businessId = GetBusinessId();
            if (businessId == 0) return BadRequest("Business not selected.");

            var result = await _customerPriceService.GetPricesByCustomerAsync(customerId, businessId);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        // GET: api/customer-prices/by-inventory/{inventoryId}
        [HttpGet("by-inventory/{inventoryId}")]
        [Permission("customerprices", "view")]
        public async Task<IActionResult> GetByInventory(int inventoryId)
        {
            var businessId = GetBusinessId();
            if (businessId == 0) return BadRequest("Business not selected.");

            var result = await _customerPriceService.GetPricesByInventoryAsync(inventoryId, businessId);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        // GET: api/customer-prices/effective?customerId=&inventoryId=
        [HttpGet("effective")]
        [Permission("customerprices", "view")]
        public async Task<IActionResult> GetEffectivePrice([FromQuery] int customerId, [FromQuery] int inventoryId)
        {
            var businessId = GetBusinessId();
            if (businessId == 0) return BadRequest("Business not selected.");

            var result = await _customerPriceService.GetEffectivePriceAsync(customerId, inventoryId, businessId);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        // POST: api/customer-prices
        [HttpPost]
        [Permission("customerprices", "edit")]
        public async Task<IActionResult> SetPrice([FromBody] SetCustomerPriceRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var businessId = GetBusinessId();
            if (businessId == 0) return BadRequest("Business not selected.");

            request.BusinessId = businessId;

            var result = await _customerPriceService.SetCustomerPriceAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        // DELETE: api/customer-prices
        [HttpDelete]
        [Permission("customerprices", "delete")]
        public async Task<IActionResult> DeletePrice([FromBody] DeleteCustomerPriceRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var businessId = GetBusinessId();
            if (businessId == 0) return BadRequest("Business not selected.");

            request.BusinessId = businessId;

            var result = await _customerPriceService.DeleteCustomerPriceAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
    }
}

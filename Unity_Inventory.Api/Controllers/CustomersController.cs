using Unity_Inventory.Domain.Features.Customers;
using Unity_Inventory.Domain.Features.Customers.Models;
using Unity_Inventory.Shared;
using Unity_Inventory.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Unity_Inventory.Api.Filters;

namespace Unity_Inventory.Api.Controllers
{
    [Route("api/customers")]
    [ApiController]
    [Authorize]
    public class CustomersController : ControllerBase
    {
        private readonly ICustomerService _customerService;

        public CustomersController(ICustomerService customerService)
        {
            _customerService = customerService;
        }

        private int GetBusinessId()
        {
            var businessIdClaim = User.FindFirst("BusinessId");
            return businessIdClaim != null ? int.Parse(businessIdClaim.Value) : 0;
        }

        [HttpGet]
        [Permission("customers", "view")]
        public async Task<IActionResult> GetCustomers([FromQuery] PaginationRequest paginationRequest)
        {
            var businessId = GetBusinessId();
            if (businessId == 0) return BadRequest("Business not selected.");   

            var result = await _customerService.GetCustomersByBusinessIdAsync(paginationRequest, businessId);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id}")]
        [Permission("customers", "view")]
        public async Task<IActionResult> GetCustomer(int id)
        {
            var result = await _customerService.GetCustomerByIdAsync(id);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost]
        [Permission("customers", "create")]
        public async Task<IActionResult> CreateCustomer([FromBody] CreateCustomerRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var businessId = GetBusinessId();
            if (businessId == 0) return BadRequest("Business not selected.");
            
            request.BusinessId = businessId;

            var result = await _customerService.CreateCustomerAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPut]
        [Permission("customers", "update")]
        public async Task<IActionResult> UpdateCustomer([FromBody] UpdateCustomerRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _customerService.UpdateCustomerAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }


        [HttpDelete("{id}")]
        [Permission("customers", "delete")]
        public async Task<IActionResult> DeleteCustomer(int id, [FromQuery] byte[] version)
        {
            var result = await _customerService.DeleteCustomerAsync(id, version);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
    }
}

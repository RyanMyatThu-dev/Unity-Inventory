using IMS.Domain.Features.Inventories;
using IMS.Domain.Features.Inventories.Models;
using IMS.shared;
using IMS.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace IMS.api.Controllers
{
    [Route("api/inventories")]
    [ApiController]
    [Authorize]
    public class InventoriesController : ControllerBase
    {
        private readonly IInventoryService _inventoryService;

        public InventoriesController(IInventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        private int GetBusinessId()
        {
            var businessIdClaim = User.FindFirst("BusinessId");
            return businessIdClaim != null ? int.Parse(businessIdClaim.Value) : 0;
        }

        [HttpGet]
        public async Task<IActionResult> GetInventories([FromQuery] PaginationRequest request)
        {
            var businessId = GetBusinessId();
            if (businessId == 0) return BadRequest("Business not selected.");

            var result = await _inventoryService.GetInventoriesByBusinessIdAsync(request, businessId);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetInventory(int id)
        {
            var result = await _inventoryService.GetInventoryByIdAsync(id);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateInventory([FromForm] CreateProductRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var businessId = GetBusinessId();
            if (businessId == 0) return BadRequest("Business not selected.");
            
            // Ensure businessId in request matches the token's businessId
            request.BusinessId = businessId;

            var result = await _inventoryService.CreateInventoryAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("photo-upload")]
        public async Task<IActionResult> UploadPhoto([FromForm] CreateProductRequest createRequest, IFormFile? photoFile)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // 1. Check if a file was actually provided
            if (photoFile == null || photoFile.Length == 0)
            {
                return BadRequest("Please provide a product photo.");
            }

            var businessId = GetBusinessId();
            if (businessId == 0) return BadRequest("Business not selected.");
            createRequest.BusinessId = businessId;

            // 2. Open a read stream from the IFormFile
            using var stream = photoFile.OpenReadStream();

            // 3. Pass the stream and the filename to your service
            var fileName = string.IsNullOrWhiteSpace(photoFile.FileName) ? "uploaded-photo" : photoFile.FileName;
            var result = await _inventoryService.CreateProductWithPhotoAsync(createRequest, stream, fileName);

            if (!result.IsSuccess)
                return BadRequest(result);

            return CreatedAtAction(
                nameof(GetInventory),
                new { id = result.Data!.Id },
                result);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateInventory([FromForm] UpdateProductRequest request, IFormFile? photoFile)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            using var stream = photoFile?.Length > 0 ? photoFile.OpenReadStream() : null;
            var fileName = string.Empty;

            if (photoFile != null && photoFile.Length > 0)
            {
                fileName = string.IsNullOrWhiteSpace(photoFile.FileName) ? "uploaded-photo" : photoFile.FileName;
            }

            var result = await _inventoryService.UpdateInventoryAsync(request, stream, fileName);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

       

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInventory(int id, [FromQuery] byte[] version)
        {
            var result = await _inventoryService.DeleteInventoryAsync(id, version);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("update-stock")]
        public async Task<IActionResult> UpdateStock([FromBody] UpdateStockRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var businessId = GetBusinessId();
            if (businessId == 0) return BadRequest("Business not selected.");

            request.BusinessId = businessId;

            var result = await _inventoryService.UpdateStockAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
    }
}

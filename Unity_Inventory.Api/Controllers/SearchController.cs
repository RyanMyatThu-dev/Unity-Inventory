using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Unity_Inventory.Api.Filters;
using Unity_Inventory.Domain.Features.Search;
using Unity_Inventory.Domain.Features.Search.Models;

namespace Unity_Inventory.Api.Controllers
{
    [Route("api/search")]
    [ApiController]
    [Authorize]
    public class SearchController : ControllerBase
    {
        private readonly ISearchService _searchService;

        public SearchController(ISearchService searchService)
        {
            _searchService = searchService;
        }

        private int GetBusinessId()
        {
            var businessIdClaim = User.FindFirst("BusinessId");
            return businessIdClaim != null ? int.Parse(businessIdClaim.Value) : 0;
        }

        [HttpGet("products")]
        [Permission("inventory", "view")]
        public async Task<IActionResult> SearchProducts([FromQuery] SearchProductRequestDTO request)
        {
            var businessId = GetBusinessId();
            if (businessId == 0) return BadRequest("Business not selected.");

            request.BusinessId = businessId;

            var result = await _searchService.SearchProductsAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpGet("categories")]
        [Permission("categories", "view")]
        public async Task<IActionResult> SearchCategories([FromQuery] SearchCategoryRequestDTO request)
        {
            var businessId = GetBusinessId();
            if (businessId == 0) return BadRequest("Business not selected.");

            request.BusinessId = businessId;

            var result = await _searchService.SearchCategoryAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
    }
}

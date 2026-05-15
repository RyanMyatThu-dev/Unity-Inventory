using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Unity_Inventory.Api.Filters;
using Unity_Inventory.Domain.Features.Inventories;
using Unity_Inventory.Domain.Features.Inventories.Models;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Unity_Inventory.Api.Controllers
{
    [Route("api/categories")]
    [ApiController]
    [Authorize]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoriesController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        private int GetBusinessId()
        {
            var businessIdClaim = User.FindFirst("BusinessId");
            return businessIdClaim != null ? int.Parse(businessIdClaim.Value) : 0;
        }

        [HttpGet]
        [Permission("categories", "view")]
        public async Task<IActionResult> GetCategories()
        {
            var businessId = GetBusinessId();
            if (businessId == 0) return BadRequest("Business not selected.");

            var result = await _categoryService.GetCategoriesAsync(businessId);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpGet("tree")]
        [Permission("categories", "view")]
        public async Task<IActionResult> GetCategoryTree()
        {
            var businessId = GetBusinessId();
            if (businessId == 0) return BadRequest("Business not selected.");

            var result = await _categoryService.GetCategoryTreeAsync(businessId);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id}")]
        [Permission("categories", "view")]
        public async Task<IActionResult> GetCategory(int id)
        {
            var result = await _categoryService.GetCategoryByIdAsync(id);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost]
        [Permission("categories", "create")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var businessId = GetBusinessId();
            if (businessId == 0) return BadRequest("Business not selected.");
            request.BusinessId = businessId;

            var result = await _categoryService.CreateCategoryAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPut]
        [Permission("categories", "edit")]
        public async Task<IActionResult> UpdateCategory([FromBody] UpdateCategoryRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _categoryService.UpdateCategoryAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("{id}")]
        [Permission("categories", "delete")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var result = await _categoryService.DeleteCategoryAsync(id);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
    }
}

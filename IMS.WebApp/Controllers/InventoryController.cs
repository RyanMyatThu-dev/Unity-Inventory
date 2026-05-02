using IMS.WebApp.Models;
using Microsoft.AspNetCore.Mvc;
using Rotativa.AspNetCore;
using System.Net.Http.Headers;
using System.Text.Json;

namespace IMS.WebApp.Controllers
{
    public class InventoryController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public InventoryController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        public IActionResult Index()
        {
            return View();
        }

        public async Task<IActionResult> PrintStock(int businessId, string? token = null)
        {
            if (businessId == 0) return BadRequest("Business ID is required");

            var client = _httpClientFactory.CreateClient();
            var baseUrl = _configuration["ApiSettings:BaseUrl"];

            if (!string.IsNullOrEmpty(token))
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            }

            // Using the existing API endpoint for inventories
            var response = await client.GetAsync($"{baseUrl}/inventories?pageNumber=1&pageSize=5000");
            if (!response.IsSuccessStatusCode)
            {
                return NotFound("Could not fetch inventory data from API.");
            }

            var json = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            
            // The API returns a PagedResult which has a different shape
            var result = JsonSerializer.Deserialize<ApiPagedResponse<InventoryDTO>>(json, options);

            if (result == null || !result.IsSuccess || result.Data == null)
            {
                return NotFound(result?.Message ?? "Inventory data not found.");
            }

            return new ViewAsPdf("PrintStock", result.Data)
            {
                FileName = $"Stock_Report_{DateTime.Now:yyyyMMdd}.pdf",
                PageSize = Rotativa.AspNetCore.Options.Size.A4,
                PageOrientation = Rotativa.AspNetCore.Options.Orientation.Portrait,
                CustomSwitches = "--disable-smart-shrinking"
            };
        }
    }
}

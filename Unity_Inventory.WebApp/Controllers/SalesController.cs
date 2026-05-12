using Unity_Inventory.WebApp.Models;
using Microsoft.AspNetCore.Mvc;
using Rotativa.AspNetCore;
using System.Net.Http.Headers;
using System.Text.Json;

namespace Unity_Inventory.WebApp.Controllers
{
    public class SalesController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public SalesController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        public IActionResult Index()
        {
            return View();
        }

        public async Task<IActionResult> PrintReport(int id, string? token = null)
        {
            var client = _httpClientFactory.CreateClient();
            var baseUrl = _configuration["ApiSettings:BaseUrl"];
            
            if (!string.IsNullOrEmpty(token))
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            }

            var response = await client.GetAsync($"{baseUrl}/sales/reports/{id}");
            if (!response.IsSuccessStatusCode)
            {
                return NotFound("Could not fetch report data from API.");
            }

            var json = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var result = JsonSerializer.Deserialize<ApiResponse<ReportDTO>>(json, options);

            if (result == null || !result.IsSuccess || result.Data == null)
            {
                return NotFound(result?.Message ?? "Report not found.");
            }

            return new ViewAsPdf("PrintReport", result.Data)
            {
                FileName = $"Report_{id}.pdf",
                PageSize = Rotativa.AspNetCore.Options.Size.A4,
                PageOrientation = Rotativa.AspNetCore.Options.Orientation.Portrait,
                CustomSwitches = "--disable-smart-shrinking"
            };
        }

        public async Task<IActionResult> PrintSalesList(int businessId, string? token = null)
        {
            var client = _httpClientFactory.CreateClient();
            var baseUrl = _configuration["ApiSettings:BaseUrl"];

            if (!string.IsNullOrEmpty(token))
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            }

            var response = await client.GetAsync($"{baseUrl}/sales/reports?pageNumber=1&pageSize=1000");
            if (!response.IsSuccessStatusCode)
            {
                return NotFound("Could not fetch sales data from API.");
            }

            var json = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var result = JsonSerializer.Deserialize<ApiPagedResponse<ReportDTO>>(json, options);

            if (result == null || !result.IsSuccess || result.Data == null)
            {
                return NotFound(result?.Message ?? "Sales data not found.");
            }

            return new ViewAsPdf("PrintSalesList", result.Data)
            {
                FileName = $"Sales_Report_List_{DateTime.Now:yyyyMMdd}.pdf",
                PageSize = Rotativa.AspNetCore.Options.Size.A4,
                PageOrientation = Rotativa.AspNetCore.Options.Orientation.Portrait,
                CustomSwitches = "--disable-smart-shrinking"
            };
        }
    }
}

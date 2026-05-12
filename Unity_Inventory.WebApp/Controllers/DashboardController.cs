using Microsoft.AspNetCore.Mvc;

namespace Unity_Inventory.WebApp.Controllers
{
    public class DashboardController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

using Microsoft.AspNetCore.Mvc;

namespace IMS.WebApp.Controllers
{
    public class DashboardController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

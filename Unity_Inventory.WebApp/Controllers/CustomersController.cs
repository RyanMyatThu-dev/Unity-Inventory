using Microsoft.AspNetCore.Mvc;

namespace Unity_Inventory.WebApp.Controllers
{
    public class CustomersController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

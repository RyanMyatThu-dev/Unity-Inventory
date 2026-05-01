using Microsoft.AspNetCore.Mvc;

namespace IMS.WebApp.Controllers
{
    public class InventoryController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

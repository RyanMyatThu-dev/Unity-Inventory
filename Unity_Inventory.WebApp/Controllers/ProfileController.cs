using Microsoft.AspNetCore.Mvc;

namespace Unity_Inventory.WebApp.Controllers
{
    public class ProfileController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

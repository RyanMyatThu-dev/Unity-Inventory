using Microsoft.AspNetCore.Mvc;

namespace Unity_Inventory.WebApp.Controllers
{
    public class BusinessController : Controller
    {
        public IActionResult Select()
        {
            return View();
        }
    }
}

using Microsoft.AspNetCore.Mvc;

namespace IMS.WebApp.Controllers
{
    public class SalesController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

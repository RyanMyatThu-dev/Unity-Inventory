using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Unity_Inventory.Domain.Features.Inventories.Models
{
    public class CategoryDTO
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? ParentCategoryId { get; set; }
        public List<CategoryDTO> SubCategories { get; set; } = new();
    }

    public class CreateCategoryRequest
    {
        [Required]
        [MaxLength(100)]
        public string CategoryName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? ParentCategoryId { get; set; }
        [Required]
        public int BusinessId { get; set; }
    }

    public class UpdateCategoryRequest
    {
        [Required]
        public int CategoryId { get; set; }
        [Required]
        [MaxLength(100)]
        public string CategoryName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? ParentCategoryId { get; set; }
    }
}

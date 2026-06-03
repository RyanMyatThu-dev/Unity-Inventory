namespace Unity_Inventory.Domain.Features.Summary.Models
{
    public class ChatMessageDto
    {
        public string Role { get; set; } = null!; // "user" or "model"
        public string Content { get; set; } = null!;
    }
}

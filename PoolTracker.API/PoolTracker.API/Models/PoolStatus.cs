namespace PoolTracker.API.Models;

public class PoolStatus
{
    public int CurrentCount { get; set; }
    public int MaxCapacity { get; set; }
    public bool IsOpen { get; set; }
    public DateTime LastUpdated { get; set; }

    public string LocationName { get; set; } = "Piscina Municipal da Sobreposta";
    public string Address { get; set; } = "R. da Piscina 22, 4715-553 Sobreposta";
    public string Phone { get; set; } = "253 636 948";

    public string TodayOpeningHours { get; set; } = string.Empty;
}
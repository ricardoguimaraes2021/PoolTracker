namespace PoolTracker.API.Models;

public class WeatherInfo
{
    public string City { get; set; } = "Sobreposta, Braga";
    public double TemperatureC { get; set; }
    public string Description { get; set; } = string.Empty;
    public double WindSpeedKmh { get; set; }
    public string Icon { get; set; } = string.Empty;
}
using PoolTracker.API.Models;
using System.Net.Http.Json;
using System.Globalization;
using System.Text.Json.Serialization;

namespace PoolTracker.API.Services;

public class WeatherService
{
    private readonly HttpClient _httpClient;

    private const double Latitude = 41.5877;
    private const double Longitude = -8.3567;

    // CACHE (5 minutos)
    private WeatherInfo? _cachedWeather;
    private DateTime _cacheExpireTime = DateTime.MinValue;

    public WeatherService(HttpClient httpClient)
    {
        httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("PoolTrackerApp/1.0");
        httpClient.DefaultRequestHeaders.TryAddWithoutValidation("Accept", "application/json");

        _httpClient = httpClient;
    }

    public async Task<WeatherInfo?> GetCurrentWeatherAsync()
    {
        // 🔥 1 — Se o cache ainda é válido, devolve de imediato (rápido e seguro)
        if (_cachedWeather != null && DateTime.UtcNow < _cacheExpireTime)
        {
            Console.WriteLine("WEATHER: returning cached data");
            return _cachedWeather;
        }

        var lat = Latitude.ToString(CultureInfo.InvariantCulture);
        var lon = Longitude.ToString(CultureInfo.InvariantCulture);

        var url =
            $"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&timezone=auto";

        Console.WriteLine("CALLING WEATHER URL: " + url);

        var response = await _httpClient.GetAsync(url);

        Console.WriteLine("WEATHER API STATUS: " + response.StatusCode);

        if (!response.IsSuccessStatusCode)
        {
            Console.WriteLine("Weather API failed: " + response.StatusCode);

            // 🔥 2 — Se falhar a API mas existe cache → devolve último valor
            if (_cachedWeather != null)
            {
                Console.WriteLine("WEATHER: returning cached data due to failure");
                return _cachedWeather;
            }

            return null;
        }

        var data = await response.Content.ReadFromJsonAsync<OpenMeteoResponse>();

        if (data?.CurrentWeather == null)
        {
            Console.WriteLine("Weather API: current_weather is null");

            // devolve cache se existir
            if (_cachedWeather != null)
                return _cachedWeather;

            return null;
        }

        var cw = data.CurrentWeather;

        // 🔥 3 — Guardar no cache
        _cachedWeather = new WeatherInfo
        {
            City = "Sobreposta, Braga",
            TemperatureC = cw.Temperature,
            WindSpeedKmh = cw.Windspeed,
            Description = MapWeatherCodeToDescription(cw.Weathercode),
            Icon = MapWeatherCodeToIcon(cw.Weathercode)
        };

        // Cache válido durante 5 minutos
        _cacheExpireTime = DateTime.UtcNow.AddMinutes(5);

        return _cachedWeather;
    }

    // -----------------------------------------
    // MAP CODE → DESCRIÇÃO
    // -----------------------------------------

    private static string MapWeatherCodeToDescription(int code) => code switch
    {
        0 => "Céu limpo",
        1 => "Maioritariamente limpo",
        2 => "Parcialmente nublado",
        3 => "Nublado",
        61 => "Chuva fraca",
        63 => "Chuva moderada",
        65 => "Chuva forte",
        80 => "Aguaceiros fracos",
        81 => "Aguaceiros moderados",
        82 => "Aguaceiros fortes",
        _ => "Condição desconhecida"
    };

    // -----------------------------------------
    // MAP CODE → ÍCONE SIMPLES
    // -----------------------------------------

    private static string MapWeatherCodeToIcon(int code) => code switch
    {
        0 => "sunny",
        1 or 2 => "cloudy",
        3 => "overcast",
        61 or 63 or 65 => "rain",
        80 or 81 or 82 => "showers",
        _ => "unknown"
    };

    // -----------------------------------------
    // MODELOS DO OPEN-METEO
    // -----------------------------------------

    private class OpenMeteoResponse
    {
        [JsonPropertyName("current_weather")]
        public CurrentWeather? CurrentWeather { get; set; }
    }

    private class CurrentWeather
    {
        [JsonPropertyName("temperature")]
        public double Temperature { get; set; }

        [JsonPropertyName("windspeed")]
        public double Windspeed { get; set; }

        [JsonPropertyName("weathercode")]
        public int Weathercode { get; set; }
    }
}

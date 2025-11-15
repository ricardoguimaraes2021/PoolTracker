using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;

namespace PoolTracker.API.Middleware
{
    public class AdminAuthMiddleware : IMiddleware
    {
        private readonly IConfiguration _config;

        public AdminAuthMiddleware(IConfiguration config)
        {
            _config = config;
        }

        public async Task InvokeAsync(HttpContext context, RequestDelegate next)
        {
            var path = context.Request.Path.Value?.ToLower();

            // Endpoints públicos
            if (path!.StartsWith("/api/pool/status") ||
                path.StartsWith("/api/weather/current"))
            {
                await next(context);
                return;
            }

            var requiredKey = _config["AdminApiKey"];   // <-- CORRIGIDO
            var providedKey = context.Request.Headers["X-Admin-Key"].ToString();

            if (string.IsNullOrEmpty(providedKey) || providedKey != requiredKey)
            {
                context.Response.StatusCode = 401;
                await context.Response.WriteAsync("Unauthorized: invalid or missing admin key.");
                return;
            }

            await next(context);
        }
    }
}
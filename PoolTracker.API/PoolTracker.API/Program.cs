using PoolTracker.API.Services;
using PoolTracker.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

builder.Services.AddControllers();

builder.Services.AddSingleton<PoolService>();
builder.Services.AddHttpClient<WeatherService>();

builder.Services.AddTransient<AdminAuthMiddleware>();

builder.Services.AddOpenApi();

var app = builder.Build();

app.UseCors("AllowAll");

app.UseMiddleware<AdminAuthMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.MapControllers();

app.Run();
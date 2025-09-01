using Microsoft.Extensions.Logging;
using ZodiacApp.Services;
using ZodiacApp.ViewModels;
using ZodiacApp.Views;

namespace ZodiacApp;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

        // Servicios
        builder.Services.AddSingleton<IUpdateService, UpdateService>();
        builder.Services.AddSingleton<IZodiacService, ZodiacService>();
        builder.Services.AddSingleton<INotificationService, NotificationService>();
        builder.Services.AddSingleton<IDownloadService, DownloadService>();

        // ViewModels
        builder.Services.AddTransient<MainViewModel>();
        builder.Services.AddTransient<UpdateViewModel>();

        // Views
        builder.Services.AddTransient<MainPage>();
        builder.Services.AddTransient<UpdatePage>();

        // HttpClient
        builder.Services.AddHttpClient("UpdateClient", client =>
        {
            client.BaseAddress = new Uri("https://zodiac-app-vert.vercel.app/");
            client.Timeout = TimeSpan.FromMinutes(10);
        });

#if DEBUG
        builder.Logging.AddDebug();
#endif

        return builder.Build();
    }
}
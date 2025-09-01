using ZodiacApp.Services;
using MauiApplication = Microsoft.Maui.Controls.Application;

namespace ZodiacApp;

public partial class App : MauiApplication
{
    public App()
    {
        InitializeComponent();
        MainPage = new AppShell();
    }

    protected override async void OnStart()
    {
        base.OnStart();
        
        // Request notification permissions on startup
        var notificationService = Handler?.MauiContext?.Services?.GetService<INotificationService>();
        if (notificationService != null)
        {
            await notificationService.RequestNotificationPermissionAsync();
        }
    }

    protected override void OnSleep()
    {
        base.OnSleep();
    }

    protected override void OnResume()
    {
        base.OnResume();
    }
}
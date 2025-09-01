using ZodiacApp.Models;

namespace ZodiacApp.Services;

public interface INotificationService
{
    Task ShowNotificationAsync(string title, string message);
    Task ShowProgressNotificationAsync(string title, DownloadProgress progress);
    Task UpdateProgressNotificationAsync(DownloadProgress progress);
    Task HideProgressNotificationAsync();
    Task<bool> RequestNotificationPermissionAsync();
}

public class NotificationService : INotificationService
{
    private const int ProgressNotificationId = 1001;
    private const string ChannelId = "zodiac_updates";
    private const string ChannelName = "Zodiac Updates";

#if ANDROID
    private Android.App.NotificationManager? _notificationManager;

    public NotificationService()
    {
        InitializeAndroid();
    }

    private void InitializeAndroid()
    {
        var context = Platform.CurrentActivity?.ApplicationContext ?? Android.App.Application.Context;
        _notificationManager = context.GetSystemService(Android.Content.Context.NotificationService) as Android.App.NotificationManager;

        if (Android.OS.Build.VERSION.SdkInt >= Android.OS.BuildVersionCodes.O)
        {
            var channel = new Android.App.NotificationChannel(ChannelId, ChannelName, Android.App.NotificationImportance.Default)
            {
                Description = "Notificaciones para actualizaciones de Zodiac App"
            };
            _notificationManager?.CreateNotificationChannel(channel);
        }
    }
#endif

    public async Task<bool> RequestNotificationPermissionAsync()
    {
        // El permiso de notificaciones se maneja en MainActivity.cs
        // Las notificaciones básicas funcionarán en la mayoría de casos
        await Task.CompletedTask;
        return true;
    }

    public async Task ShowNotificationAsync(string title, string message)
    {
        await Task.Run(() =>
        {
#if ANDROID
            var context = Platform.CurrentActivity?.ApplicationContext ?? Android.App.Application.Context;

            var builder = new Android.App.Notification.Builder(context, ChannelId)
                .SetContentTitle(title)
                .SetContentText(message)
                .SetSmallIcon(Android.Resource.Drawable.StatNotifySync)
                .SetAutoCancel(true);

            if (Android.OS.Build.VERSION.SdkInt >= Android.OS.BuildVersionCodes.JellyBean)
            {
                builder.SetPriority((int)Android.App.NotificationPriority.Default);
            }

            _notificationManager?.Notify(DateTime.Now.Millisecond, builder.Build());
#endif
        });
    }

    public async Task ShowProgressNotificationAsync(string title, DownloadProgress progress)
    {
        await Task.Run(() =>
        {
#if ANDROID
            var context = Platform.CurrentActivity?.ApplicationContext ?? Android.App.Application.Context;

            var builder = new Android.App.Notification.Builder(context, ChannelId)
                .SetContentTitle(title)
                .SetContentText($"{progress.Status} - {progress.PercentComplete:F1}%")
                .SetSmallIcon(Android.Resource.Drawable.StatSysDownload)
                .SetProgress(100, (int)progress.PercentComplete, false)
                .SetOngoing(true)
                .SetAutoCancel(false);

            if (Android.OS.Build.VERSION.SdkInt >= Android.OS.BuildVersionCodes.JellyBean)
            {
                builder.SetPriority((int)Android.App.NotificationPriority.Low);
            }

            _notificationManager?.Notify(ProgressNotificationId, builder.Build());
#endif
        });
    }

    public async Task UpdateProgressNotificationAsync(DownloadProgress progress)
    {
        await Task.Run(() =>
        {
#if ANDROID
            var context = Platform.CurrentActivity?.ApplicationContext ?? Android.App.Application.Context;

            var builder = new Android.App.Notification.Builder(context, ChannelId)
                .SetContentTitle("Descargando actualización")
                .SetContentText($"{progress.Status} - {progress.PercentComplete:F1}%")
                .SetSmallIcon(Android.Resource.Drawable.StatSysDownload)
                .SetProgress(100, (int)progress.PercentComplete, false)
                .SetOngoing(true)
                .SetAutoCancel(false);

            if (Android.OS.Build.VERSION.SdkInt >= Android.OS.BuildVersionCodes.JellyBean)
            {
                builder.SetPriority((int)Android.App.NotificationPriority.Low);
            }

            _notificationManager?.Notify(ProgressNotificationId, builder.Build());
#endif
        });
    }

    public async Task HideProgressNotificationAsync()
    {
        await Task.Run(() =>
        {
#if ANDROID
            _notificationManager?.Cancel(ProgressNotificationId);
#endif
        });
    }
}
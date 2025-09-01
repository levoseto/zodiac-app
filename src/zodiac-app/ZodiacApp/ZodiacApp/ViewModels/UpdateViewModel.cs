using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using ZodiacApp.Models;
using ZodiacApp.Services;

namespace ZodiacApp.ViewModels;

public partial class UpdateViewModel : ObservableObject
{
    private readonly IUpdateService _updateService;
    private readonly IDownloadService _downloadService;
    private readonly INotificationService _notificationService;
    private CancellationTokenSource? _downloadCancellationTokenSource;

    [ObservableProperty]
    private UpdateStatus currentStatus = UpdateStatus.CheckingForUpdate;

    [ObservableProperty]
    private VersionInfo? latestVersion;

    [ObservableProperty]
    private string currentVersion;

    [ObservableProperty]
    private bool hasUpdate;

    [ObservableProperty]
    private bool isDownloading;

    [ObservableProperty]
    private bool isInstalling;

    [ObservableProperty]
    private double downloadProgress;

    [ObservableProperty]
    private string downloadProgressText = "0%";

    [ObservableProperty]
    private string statusMessage = "Verificando actualizaciones...";

    [ObservableProperty]
    private string downloadedFilePath = string.Empty;

    [ObservableProperty]
    private bool canDownload;

    [ObservableProperty]
    private bool canInstall;

    [ObservableProperty]
    private bool canCancel;

    public UpdateViewModel(IUpdateService updateService, IDownloadService downloadService, INotificationService notificationService)
    {
        _updateService = updateService;
        _downloadService = downloadService;
        _notificationService = notificationService;
        
        CurrentVersion = _updateService.GetCurrentVersion();
    }

    public async Task InitializeAsync()
    {
        await CheckForUpdatesAsync();
    }

    [RelayCommand]
    private async Task CheckForUpdatesAsync()
    {
        try
        {
            CurrentStatus = UpdateStatus.CheckingForUpdate;
            StatusMessage = "Verificando actualizaciones...";
            ResetButtons();

            var versionComparison = await _updateService.CheckForUpdatesAsync();
            
            if (versionComparison == null)
            {
                CurrentStatus = UpdateStatus.Error;
                StatusMessage = "Error al verificar actualizaciones";
                return;
            }

            HasUpdate = versionComparison.HasUpdate;

            if (versionComparison.HasUpdate)
            {
                var latest = await _updateService.GetLatestVersionAsync();
                if (latest != null)
                {
                    LatestVersion = latest;
                    CurrentStatus = UpdateStatus.UpdateAvailable;
                    StatusMessage = $"Nueva versión disponible: {latest.Version}";
                    CanDownload = true;
                }
            }
            else
            {
                CurrentStatus = UpdateStatus.NoUpdateNeeded;
                StatusMessage = "No hay actualizaciones disponibles";
            }
        }
        catch (Exception ex)
        {
            CurrentStatus = UpdateStatus.Error;
            StatusMessage = $"Error: {ex.Message}";
        }
    }

    [RelayCommand]
    private async Task DownloadUpdateAsync()
    {
        if (LatestVersion == null) return;

        try
        {
            CurrentStatus = UpdateStatus.Downloading;
            IsDownloading = true;
            CanDownload = false;
            CanCancel = true;
            
            _downloadCancellationTokenSource = new CancellationTokenSource();
            
            var progress = new Progress<DownloadProgress>(OnDownloadProgressChanged);
            var fileName = $"zodiac-app-v{LatestVersion.Version}.apk";
            
            await _notificationService.ShowProgressNotificationAsync("Descargando actualización", new DownloadProgress
            {
                Status = "Iniciando descarga...",
            });

            DownloadedFilePath = await _downloadService.DownloadFileAsync(
                LatestVersion.DownloadUrl, 
                fileName, 
                progress, 
                _downloadCancellationTokenSource.Token) ?? string.Empty;

            if (!string.IsNullOrEmpty(DownloadedFilePath))
            {
                CurrentStatus = UpdateStatus.Downloaded;
                StatusMessage = "Descarga completada. Listo para instalar.";
                IsDownloading = false;
                CanInstall = true;
                CanCancel = false;
                
                await _notificationService.HideProgressNotificationAsync();
                await _notificationService.ShowNotificationAsync(
                    "Descarga completada", 
                    "La actualización está lista para instalar");
            }
            else
            {
                CurrentStatus = UpdateStatus.Error;
                StatusMessage = "Error en la descarga";
                ResetButtons();
            }
        }
        catch (OperationCanceledException)
        {
            CurrentStatus = UpdateStatus.UpdateAvailable;
            StatusMessage = "Descarga cancelada";
            IsDownloading = false;
            CanDownload = true;
            CanCancel = false;
            await _notificationService.HideProgressNotificationAsync();
        }
        catch (Exception ex)
        {
            CurrentStatus = UpdateStatus.Error;
            StatusMessage = $"Error en la descarga: {ex.Message}";
            IsDownloading = false;
            ResetButtons();
            await _notificationService.HideProgressNotificationAsync();
        }
    }

    [RelayCommand]
    private async Task InstallUpdateAsync()
    {
        if (string.IsNullOrEmpty(DownloadedFilePath)) return;

        try
        {
            CurrentStatus = UpdateStatus.Installing;
            IsInstalling = true;
            CanInstall = false;
            StatusMessage = "Instalando actualización...";

            var success = await _updateService.InstallUpdateAsync(DownloadedFilePath);
            
            if (success)
            {
                CurrentStatus = UpdateStatus.Completed;
                StatusMessage = "Actualización completada. La aplicación se reiniciará.";
                
                await _notificationService.ShowNotificationAsync(
                    "Actualización instalada", 
                    "La aplicación se actualizó correctamente");
            }
            else
            {
                CurrentStatus = UpdateStatus.Error;
                StatusMessage = "Error al instalar la actualización";
                IsInstalling = false;
                CanInstall = true;
            }
        }
        catch (Exception ex)
        {
            CurrentStatus = UpdateStatus.Error;
            StatusMessage = $"Error en la instalación: {ex.Message}";
            IsInstalling = false;
            CanInstall = true;
        }
    }

    [RelayCommand]
    private async Task CancelDownloadAsync()
    {
        _downloadCancellationTokenSource?.Cancel();
        await _notificationService.HideProgressNotificationAsync();
    }

    private async void OnDownloadProgressChanged(DownloadProgress progress)
    {
        DownloadProgress = progress.PercentComplete;
        DownloadProgressText = $"{progress.PercentComplete:F1}%";
        StatusMessage = $"Descargando... {progress.PercentComplete:F1}%";
        
        await _notificationService.UpdateProgressNotificationAsync(progress);
    }

    private void ResetButtons()
    {
        CanDownload = false;
        CanInstall = false;
        CanCancel = false;
        IsDownloading = false;
        IsInstalling = false;
        DownloadProgress = 0;
        DownloadProgressText = "0%";
    }
}
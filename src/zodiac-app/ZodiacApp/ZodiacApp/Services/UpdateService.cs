using Microsoft.Extensions.Logging;
using System.Text.Json;
using ZodiacApp.Models;

namespace ZodiacApp.Services;

public interface IUpdateService
{
    Task<VersionComparison?> CheckForUpdatesAsync();
    Task<VersionInfo?> GetLatestVersionAsync();
    string GetCurrentVersion();
    Task<bool> InstallUpdateAsync(string apkPath);
}

public class UpdateService : IUpdateService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<UpdateService> _logger;

    public UpdateService(IHttpClientFactory httpClientFactory, ILogger<UpdateService> logger)
    {
        _httpClient = httpClientFactory.CreateClient("UpdateClient");
        _logger = logger;
    }

    public string GetCurrentVersion()
    {
        return AppInfo.VersionString;
    }

    public async Task<VersionComparison?> CheckForUpdatesAsync()
    {
        try
        {
            var currentVersion = GetCurrentVersion();
            var response = await _httpClient.GetAsync($"api/version/compare/{currentVersion}");

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"Error checking for updates: {response.StatusCode}");
                return null;
            }

            var jsonContent = await response.Content.ReadAsStringAsync();
            var versionComparison = JsonSerializer.Deserialize<VersionComparison>(jsonContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return versionComparison;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception occurred while checking for updates");
            return null;
        }
    }

    public async Task<VersionInfo?> GetLatestVersionAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync("api/version/latest");

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"Error getting latest version: {response.StatusCode}");
                return null;
            }

            var jsonContent = await response.Content.ReadAsStringAsync();
            var apiResponse = JsonSerializer.Deserialize<ApiResponse<VersionInfo>>(jsonContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return apiResponse?.Data;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception occurred while getting latest version");
            return null;
        }
    }

    public async Task<bool> InstallUpdateAsync(string apkPath)
    {
        try
        {
            if (!File.Exists(apkPath))
            {
                _logger.LogError($"APK file not found: {apkPath}");
                return false;
            }

#if ANDROID
            return await InstallApkOnAndroid(apkPath);
#else
            _logger.LogWarning("Install update is only supported on Android");
            return false;
#endif
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error installing update");
            return false;
        }
    }

#if ANDROID
    private async Task<bool> InstallApkOnAndroid(string apkPath)
    {
        try
        {
            var context = Platform.CurrentActivity ?? Android.App.Application.Context;
            var file = new Java.IO.File(apkPath);

            // Método simplificado que funciona en la mayoría de casos
            var install = new Android.Content.Intent(Android.Content.Intent.ActionView);
            install.SetDataAndType(Android.Net.Uri.FromFile(file), "application/vnd.android.package-archive");
            install.SetFlags(Android.Content.ActivityFlags.NewTask);

            // Para Android 8.0+ necesitamos verificar el permiso de instalación
            if (Android.OS.Build.VERSION.SdkInt >= Android.OS.BuildVersionCodes.O)
            {
                var packageManager = context.PackageManager;
                if (packageManager != null && !packageManager.CanRequestPackageInstalls())
                {
                    _logger.LogWarning("App doesn't have permission to install packages");
                    // El usuario necesita habilitar "Instalar aplicaciones desconocidas" manualmente
                }
            }

            context.StartActivity(install);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error installing APK on Android");
            return false;
        }
    }
#endif
}
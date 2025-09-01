using Microsoft.Extensions.Logging;
using System.Net.Http;
using ZodiacApp.Models;

namespace ZodiacApp.Services;

public interface IDownloadService
{
    Task<string?> DownloadFileAsync(string downloadUrl, string fileName, IProgress<DownloadProgress>? progress = null, CancellationToken cancellationToken = default);
    Task<bool> DeleteFileAsync(string filePath);
}

public class DownloadService : IDownloadService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<DownloadService> _logger;

    public DownloadService(IHttpClientFactory httpClientFactory, ILogger<DownloadService> logger)
    {
        _httpClient = httpClientFactory.CreateClient("UpdateClient");
        _logger = logger;
    }

    public async Task<string?> DownloadFileAsync(string downloadUrl, string fileName, IProgress<DownloadProgress>? progress = null, CancellationToken cancellationToken = default)
    {
        try
        {
            // Crear directorio de descargas si no existe
            var downloadsPath = Path.Combine(FileSystem.CacheDirectory, "downloads");
            Directory.CreateDirectory(downloadsPath);

            var filePath = Path.Combine(downloadsPath, fileName);

            // Si el archivo ya existe, eliminarlo
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }

            using var response = await _httpClient.GetAsync(downloadUrl, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"Error downloading file: {response.StatusCode}");
                return null;
            }

            var totalBytes = response.Content.Headers.ContentLength ?? 0;
            var downloadProgress = new DownloadProgress
            {
                TotalBytesToReceive = totalBytes,
                Status = "Descargando..."
            };

            using var contentStream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None, 8192, true);

            var buffer = new byte[8192];
            long totalRead = 0;

            while (true)
            {
                var bytesRead = await contentStream.ReadAsync(buffer, 0, buffer.Length, cancellationToken);
                if (bytesRead == 0)
                    break;

                await fileStream.WriteAsync(buffer, 0, bytesRead, cancellationToken);
                totalRead += bytesRead;

                downloadProgress.BytesReceived = totalRead;
                progress?.Report(downloadProgress);
            }

            downloadProgress.Status = "Descarga completada";
            progress?.Report(downloadProgress);

            _logger.LogInformation($"File downloaded successfully: {filePath}");
            return filePath;
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Download was cancelled");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error downloading file from {downloadUrl}");
            return null;
        }
    }

    public async Task<bool> DeleteFileAsync(string filePath)
    {
        try
        {
            if (File.Exists(filePath))
            {
                await Task.Run(() => File.Delete(filePath));
                _logger.LogInformation($"File deleted: {filePath}");
                return true;
            }
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting file: {filePath}");
            return false;
        }
    }
}
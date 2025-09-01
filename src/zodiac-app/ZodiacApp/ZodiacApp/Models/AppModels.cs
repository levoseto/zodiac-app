using System.Text.Json.Serialization;

namespace ZodiacApp.Models;

public class ApiResponse<T>
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("data")]
    public T? Data { get; set; }
}

public class VersionInfo
{
    [JsonPropertyName("version")]
    public string Version { get; set; } = string.Empty;

    [JsonPropertyName("releaseNotes")]
    public string ReleaseNotes { get; set; } = string.Empty;

    [JsonPropertyName("fileSize")]
    public long FileSize { get; set; }

    [JsonPropertyName("uploadDate")]
    public DateTime UploadDate { get; set; }

    [JsonPropertyName("minAndroidVersion")]
    public string MinAndroidVersion { get; set; } = string.Empty;

    [JsonPropertyName("targetSdkVersion")]
    public int TargetSdkVersion { get; set; }

    [JsonPropertyName("downloadUrl")]
    public string DownloadUrl { get; set; } = string.Empty;
}

public class VersionComparison
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("hasUpdate")]
    public bool HasUpdate { get; set; }

    [JsonPropertyName("currentVersion")]
    public string CurrentVersion { get; set; } = string.Empty;

    [JsonPropertyName("latestVersion")]
    public string LatestVersion { get; set; } = string.Empty;

    [JsonPropertyName("releaseNotes")]
    public string? ReleaseNotes { get; set; }

    [JsonPropertyName("downloadUrl")]
    public string? DownloadUrl { get; set; }

    [JsonPropertyName("fileSize")]
    public long? FileSize { get; set; }
}

public class ZodiacSign
{
    public string Name { get; set; } = string.Empty;
    public string Symbol { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Element { get; set; } = string.Empty;
    public string Dates { get; set; } = string.Empty;
    public string Characteristics { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}

public class DownloadProgress
{
    public long BytesReceived { get; set; }
    public long TotalBytesToReceive { get; set; }
    public double PercentComplete => TotalBytesToReceive > 0 ? (double)BytesReceived / TotalBytesToReceive * 100 : 0;
    public string Status { get; set; } = string.Empty;
}

public enum UpdateStatus
{
    CheckingForUpdate,
    UpdateAvailable,
    Downloading,
    Downloaded,
    Installing,
    Completed,
    Error,
    NoUpdateNeeded
}
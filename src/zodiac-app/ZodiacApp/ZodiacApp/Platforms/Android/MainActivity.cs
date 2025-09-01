using Android.App;
using Android.Content.PM;
using Android.OS;

namespace ZodiacApp.Platforms.Android;

[Activity(
    Theme = "@style/Maui.SplashTheme",
    MainLauncher = true,
    LaunchMode = LaunchMode.SingleTop,
    ConfigurationChanges = ConfigChanges.ScreenSize | ConfigChanges.Orientation | ConfigChanges.UiMode | ConfigChanges.ScreenLayout | ConfigChanges.SmallestScreenSize | ConfigChanges.Density)]
public class MainActivity : MauiAppCompatActivity
{
    private const int RequestInstallPermission = 1001;
    private const int RequestNotificationPermission = 1002;
    private const int RequestStoragePermission = 1003;

    protected override void OnCreate(Bundle? savedInstanceState)
    {
        base.OnCreate(savedInstanceState);

        // Request permissions
        RequestPermissions();
    }

    private void RequestPermissions()
    {
        // Storage permissions (para versiones anteriores a Android 11)
        if (Build.VERSION.SdkInt >= BuildVersionCodes.M && Build.VERSION.SdkInt < BuildVersionCodes.R)
        {
            if (CheckSelfPermission(global::Android.Manifest.Permission.WriteExternalStorage) != Permission.Granted ||
                CheckSelfPermission(global::Android.Manifest.Permission.ReadExternalStorage) != Permission.Granted)
            {
                RequestPermissions(new[] {
                    global::Android.Manifest.Permission.WriteExternalStorage,
                    global::Android.Manifest.Permission.ReadExternalStorage
                }, RequestStoragePermission);
            }
        }

        // Install permission
        if (Build.VERSION.SdkInt >= BuildVersionCodes.O)
        {
            if (!PackageManager!.CanRequestPackageInstalls())
            {
                var intent = new global::Android.Content.Intent(global::Android.Provider.Settings.ActionManageUnknownAppSources)
                    .SetData(global::Android.Net.Uri.Parse($"package:{PackageName}"));
                StartActivityForResult(intent, RequestInstallPermission);
            }
        }

        // Notification permission (Android 13+)
        if (Build.VERSION.SdkInt >= BuildVersionCodes.Tiramisu)
        {
            if (CheckSelfPermission(global::Android.Manifest.Permission.PostNotifications) != Permission.Granted)
            {
                RequestPermissions(new[] { global::Android.Manifest.Permission.PostNotifications }, RequestNotificationPermission);
            }
        }
    }

    public override void OnRequestPermissionsResult(int requestCode, string[] permissions, Permission[] grantResults)
    {
        base.OnRequestPermissionsResult(requestCode, permissions, grantResults);

        switch (requestCode)
        {
            case RequestStoragePermission:
                if (grantResults.Length > 0 && grantResults[0] == Permission.Granted)
                {
                    // Storage permission granted
                }
                else
                {
                    // Storage permission denied
                    ShowPermissionDialog("Almacenamiento", "La aplicación necesita permisos de almacenamiento para descargar actualizaciones.");
                }
                break;

            case RequestNotificationPermission:
                if (grantResults.Length > 0 && grantResults[0] == Permission.Granted)
                {
                    // Notification permission granted
                }
                else
                {
                    // Notification permission denied
                    ShowPermissionDialog("Notificaciones", "La aplicación necesita permisos de notificación para mostrar el progreso de descarga.");
                }
                break;
        }
    }

    protected override void OnActivityResult(int requestCode, Result resultCode, global::Android.Content.Intent? data)
    {
        base.OnActivityResult(requestCode, resultCode, data);

        if (requestCode == RequestInstallPermission)
        {
            if (Build.VERSION.SdkInt >= BuildVersionCodes.O)
            {
                if (!PackageManager!.CanRequestPackageInstalls())
                {
                    ShowPermissionDialog("Instalación", "La aplicación necesita permisos para instalar APKs para poder actualizarse automáticamente.");
                }
            }
        }
    }

    private void ShowPermissionDialog(string permissionType, string message)
    {
        var builder = new AlertDialog.Builder(this);
        builder.SetTitle($"Permiso de {permissionType} Requerido");
        builder.SetMessage(message);
        builder.SetPositiveButton("Configurar", (sender, e) =>
        {
            var intent = new global::Android.Content.Intent(global::Android.Provider.Settings.ActionApplicationDetailsSettings);
            var uri = global::Android.Net.Uri.FromParts("package", PackageName, null);
            intent.SetData(uri);
            StartActivity(intent);
        });
        builder.SetNegativeButton("Cancelar", (sender, e) => { });
        builder.Show();
    }
}
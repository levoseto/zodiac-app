using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System.Collections.ObjectModel;
using ZodiacApp.Models;
using ZodiacApp.Services;

namespace ZodiacApp.ViewModels;

public partial class MainViewModel : ObservableObject
{
    private readonly IZodiacService _zodiacService;
    private readonly IUpdateService _updateService;
    private readonly INotificationService _notificationService;

    [ObservableProperty]
    private DateTime selectedDate = DateTime.Today;

    [ObservableProperty]
    private ZodiacSign? currentSign;

    [ObservableProperty]
    private bool isLoading;

    [ObservableProperty]
    private string welcomeMessage = "¡Descubre tu signo zodiacal!";

    [ObservableProperty]
    private bool hasUpdateAvailable;

    [ObservableProperty]
    private string currentVersion;

    [ObservableProperty]
    private string latestVersion = string.Empty;

    public ObservableCollection<ZodiacSign> AllZodiacSigns { get; }

    public MainViewModel(IZodiacService zodiacService, IUpdateService updateService, INotificationService notificationService)
    {
        _zodiacService = zodiacService;
        _updateService = updateService;
        _notificationService = notificationService;
        
        AllZodiacSigns = new ObservableCollection<ZodiacSign>(_zodiacService.GetAllZodiacSigns());
        CurrentVersion = _updateService.GetCurrentVersion();
        
        // Calcular signo inicial
        CalculateZodiacSign();
    }

    [RelayCommand]
    private void CalculateZodiacSign()
    {
        CurrentSign = _zodiacService.GetZodiacSign(SelectedDate);
    }

    [RelayCommand]
    private async Task CheckForUpdatesAsync()
    {
        try
        {
            IsLoading = true;
            
            var versionComparison = await _updateService.CheckForUpdatesAsync();
            
            if (versionComparison != null)
            {
                HasUpdateAvailable = versionComparison.HasUpdate;
                
                if (versionComparison.HasUpdate)
                {
                    LatestVersion = versionComparison.LatestVersion;
                    await _notificationService.ShowNotificationAsync(
                        "Actualización disponible", 
                        $"Nueva versión {LatestVersion} disponible para descargar");
                }
                else
                {
                    await _notificationService.ShowNotificationAsync(
                        "Sin actualizaciones", 
                        "Ya tienes la última versión instalada");
                }
            }
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Error", $"Error al verificar actualizaciones: {ex.Message}", "OK");
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task GoToUpdatePageAsync()
    {
        await Shell.Current.GoToAsync("//UpdatePage");
    }

    [RelayCommand]
    private async Task ShowZodiacInfoAsync()
    {
        if (CurrentSign != null)
        {
            var message = $"Signo: {CurrentSign.Name} {CurrentSign.Symbol}\n" +
                         $"Elemento: {CurrentSign.Element}\n" +
                         $"Fechas: {CurrentSign.Dates}\n\n" +
                         $"Características: {CurrentSign.Characteristics}";
            
            await Shell.Current.DisplayAlert(CurrentSign.Name, message, "OK");
        }
    }

    partial void OnSelectedDateChanged(DateTime value)
    {
        CalculateZodiacSign();
    }
}
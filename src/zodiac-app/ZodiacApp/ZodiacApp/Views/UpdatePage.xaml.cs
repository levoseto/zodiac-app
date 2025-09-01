using ZodiacApp.ViewModels;

namespace ZodiacApp.Views;

public partial class UpdatePage : ContentPage
{
    private readonly UpdateViewModel _viewModel;

    public UpdatePage(UpdateViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;
        BindingContext = _viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _viewModel.InitializeAsync();
    }

    protected override bool OnBackButtonPressed()
    {
        // If downloading, ask for confirmation
        if (_viewModel.IsDownloading)
        {
            Device.BeginInvokeOnMainThread(async () =>
            {
                var result = await DisplayAlert(
                    "Cancelar descarga",
                    "¿Estás seguro de que quieres cancelar la descarga?",
                    "Sí", "No");

                if (result)
                {
                    await _viewModel.CancelDownloadCommand.ExecuteAsync(null);
                    await Shell.Current.GoToAsync("..");
                }
            });
            return true; // Prevent default back behavior
        }

        return base.OnBackButtonPressed();
    }
}
using ZodiacApp.ViewModels;

namespace ZodiacApp.Views;

public partial class MainPage : ContentPage
{
    public MainPage(MainViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();

        // Auto-check for updates when the app starts
        if (BindingContext is MainViewModel viewModel)
        {
            await viewModel.CheckForUpdatesCommand.ExecuteAsync(null);
        }
    }
}
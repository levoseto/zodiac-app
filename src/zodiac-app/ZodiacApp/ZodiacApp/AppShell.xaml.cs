using ZodiacApp.Views;

namespace ZodiacApp;

public partial class AppShell : Shell
{
    public AppShell()
    {
        InitializeComponent();
        
        // Register routes for navigation
        Routing.RegisterRoute("MainPage", typeof(MainPage));
        Routing.RegisterRoute("UpdatePage", typeof(UpdatePage));
    }
}
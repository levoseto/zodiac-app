\# Zodiac App - Aplicación .NET MAUI con Auto-actualización



Una aplicación móvil para Android desarrollada con .NET MAUI que determina tu signo zodiacal según tu fecha de nacimiento y se actualiza automáticamente mediante HTTP.



\## 🚀 Características



\- \*\*Funcionalidad Principal\*\*: Determina el signo zodiacal basado en la fecha de nacimiento

\- \*\*Auto-actualización\*\*: Detecta y descarga automáticamente nuevas versiones

\- \*\*Progreso de descarga\*\*: Muestra el progreso tanto en la app como en notificaciones

\- \*\*Instalación automática\*\*: Instala las actualizaciones descargadas

\- \*\*Interfaz moderna\*\*: Diseño intuitivo con colores representativos de cada signo

\- \*\*Notificaciones nativas\*\*: Alertas del sistema durante el proceso de actualización



\## 🛠️ Configuración del Proyecto



\### Prerequisitos



\- Visual Studio 2022 con workload de .NET MAUI

\- .NET 8.0 SDK

\- Android SDK (API 21 o superior)

\- Tu API de actualizaciones desplegada



\### Instalación



1\. \*\*Clonar/crear el proyecto\*\*:

&nbsp;  ```bash

&nbsp;  dotnet new maui -n ZodiacApp

&nbsp;  cd ZodiacApp

&nbsp;  ```



2\. \*\*Configurar la URL de tu API\*\*:

&nbsp;  - Edita `MauiProgram.cs`

&nbsp;  - Cambia `https://your-api-domain.com/` por tu dominio real



3\. \*\*Restaurar paquetes NuGet\*\*:

&nbsp;  ```bash

&nbsp;  dotnet restore

&nbsp;  ```



4\. \*\*Compilar el proyecto\*\*:

&nbsp;  ```bash

&nbsp;  dotnet build

&nbsp;  ```



\## 📱 Estructura del Proyecto



```

ZodiacApp/

├── Models/           # Modelos de datos

├── Services/         # Servicios (API, Notificaciones, etc.)

├── ViewModels/       # ViewModels MVVM

├── Views/           # Páginas XAML

├── Converters/      # Convertidores de valores

└── Platforms/

&nbsp;   └── Android/     # Configuración específica de Android

```



\## 🔧 Configuración de la API



Asegúrate de que tu API esté configurada con los siguientes endpoints:



\- `GET /api/version/latest` - Obtener la versión más reciente

\- `GET /api/version/compare/{version}` - Comparar versiones

\- `GET /api/download/{version}` - Descargar APK



\## 📋 Permisos Requeridos



La aplicación solicita los siguientes permisos en Android:



\- `INTERNET` - Para conectarse a la API

\- `REQUEST\_INSTALL\_PACKAGES` - Para instalar actualizaciones

\- `WRITE\_EXTERNAL\_STORAGE` - Para guardar archivos descargados

\- `POST\_NOTIFICATIONS` - Para mostrar notificaciones de progreso



\## 🎯 Funcionalidades Implementadas



\### Sistema de Actualización

\- ✅ Verificación automática de actualizaciones al iniciar

\- ✅ Descarga en segundo plano con progreso

\- ✅ Notificaciones del sistema

\- ✅ Instalación automática de APK

\- ✅ Manejo de errores y cancelación



\### Aplicación Principal

\- ✅ Cálculo de signo zodiacal

\- ✅ Información detallada de cada signo

\- ✅ Interfaz responsive y moderna

\- ✅ Navegación fluida



\## 🔄 Flujo de Actualización



1\. \*\*Verificación\*\*: Al abrir la app, verifica automáticamente si hay actualizaciones

2\. \*\*Notificación\*\*: Si hay una actualización, muestra un banner en la pantalla principal

3\. \*\*Descarga\*\*: El usuario puede iniciar la descarga desde la pestaña "Actualización"

4\. \*\*Progreso\*\*: Muestra el progreso tanto en la app como en la barra de notificaciones

5\. \*\*Instalación\*\*: Una vez descargada, permite instalar la nueva versión

6\. \*\*Reinicio\*\*: La app se reinicia automáticamente con la nueva versión



\## 🎨 Personalización



\### Colores de los Signos

Cada signo zodiacal tiene su color representativo definido en `ZodiacService.cs`. Puedes modificar los colores editando la propiedad `Color` de cada signo.



\### API Endpoint

Para cambiar la URL de tu API, edita el `HttpClient` en `MauiProgram.cs`:



```csharp

builder.Services.AddHttpClient("UpdateClient", client =>

{

&nbsp;   client.BaseAddress = new Uri("https://tu-dominio.com/");

&nbsp;   client.Timeout = TimeSpan.FromMinutes(10);

});

```



\## 📱 Compilación para Producción



\### Debug

```bash

dotnet build -c Debug -f net8.0-android

```



\### Release

```bash

dotnet publish -c Release -f net8.0-android

```



\### APK Firmado

Para distribución, genera un APK firmado:



```bash

dotnet publish -c Release -f net8.0-android \\

&nbsp; -p:AndroidKeyStore=true \\

&nbsp; -p:AndroidSigningKeyStore=myapp.keystore \\

&nbsp; -p:AndroidSigningKeyAlias=mykey \\

&nbsp; -p:AndroidSigningKeyPass=mypassword \\

&nbsp; -p:AndroidSigningStorePass=mystorepassword

```



\## 🚨 Consideraciones de Seguridad



\- La descarga de APKs requiere permisos especiales en Android

\- Los usuarios deben permitir "Fuentes desconocidas" para instalar actualizaciones

\- Asegúrate de que tu API esté protegida con HTTPS

\- Considera implementar verificación de firmas de APK



\## 🐛 Solución de Problemas



\### Error de Permisos

Si la app no puede instalar actualizaciones:

1\. Ve a Configuración → Aplicaciones → ZodiacApp

2\. Habilita "Instalar aplicaciones desconocidas"



\### Error de Red

\- Verifica que la URL de la API esté correcta

\- Asegúrate de que el dispositivo tenga conexión a internet

\- Revisa los logs en Output de Visual Studio



\### Error de Descarga

\- Verifica permisos de almacenamiento

\- Asegúrate de que hay espacio suficiente en el dispositivo



\## 📄 Licencia



Este proyecto está disponible bajo la licencia MIT.



\## 🤝 Contribuciones



Las contribuciones son bienvenidas. Por favor:

1\. Fork el proyecto

2\. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)

3\. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)

4\. Push a la rama (`git push origin feature/AmazingFeature`)

5\. Abre un Pull Request



---



\*\*Nota\*\*: Recuerda actualizar la URL de tu API en `MauiProgram.cs` antes de compilar para producción.


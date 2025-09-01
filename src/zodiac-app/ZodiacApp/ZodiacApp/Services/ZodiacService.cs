using ZodiacApp.Models;

namespace ZodiacApp.Services;

public interface IZodiacService
{
    ZodiacSign GetZodiacSign(DateTime birthDate);
    List<ZodiacSign> GetAllZodiacSigns();
}

public class ZodiacService : IZodiacService
{
    private readonly List<ZodiacSign> _zodiacSigns;

    public ZodiacService()
    {
        _zodiacSigns = InitializeZodiacSigns();
    }

    public ZodiacSign GetZodiacSign(DateTime birthDate)
    {
        var month = birthDate.Month;
        var day = birthDate.Day;

        return (month, day) switch
        {
            (3, >= 21) or (4, <= 19) => _zodiacSigns.First(s => s.Name == "Aries"),
            (4, >= 20) or (5, <= 20) => _zodiacSigns.First(s => s.Name == "Tauro"),
            (5, >= 21) or (6, <= 20) => _zodiacSigns.First(s => s.Name == "Géminis"),
            (6, >= 21) or (7, <= 22) => _zodiacSigns.First(s => s.Name == "Cáncer"),
            (7, >= 23) or (8, <= 22) => _zodiacSigns.First(s => s.Name == "Leo"),
            (8, >= 23) or (9, <= 22) => _zodiacSigns.First(s => s.Name == "Virgo"),
            (9, >= 23) or (10, <= 22) => _zodiacSigns.First(s => s.Name == "Libra"),
            (10, >= 23) or (11, <= 21) => _zodiacSigns.First(s => s.Name == "Escorpio"),
            (11, >= 22) or (12, <= 21) => _zodiacSigns.First(s => s.Name == "Sagitario"),
            (12, >= 22) or (1, <= 19) => _zodiacSigns.First(s => s.Name == "Capricornio"),
            (1, >= 20) or (2, <= 18) => _zodiacSigns.First(s => s.Name == "Acuario"),
            (2, >= 19) or (3, <= 20) => _zodiacSigns.First(s => s.Name == "Piscis"),
            _ => _zodiacSigns.First() // Fallback
        };
    }

    public List<ZodiacSign> GetAllZodiacSigns()
    {
        return _zodiacSigns.ToList();
    }

    private List<ZodiacSign> InitializeZodiacSigns()
    {
        return new List<ZodiacSign>
        {
            new ZodiacSign
            {
                Name = "Aries",
                Symbol = "♈",
                Dates = "21 Marzo - 19 Abril",
                Element = "Fuego",
                Color = "#FF6B6B",
                Description = "El carnero. Primer signo del zodíaco.",
                Characteristics = "Energético, impulsivo, líder natural, valiente, competitivo."
            },
            new ZodiacSign
            {
                Name = "Tauro",
                Symbol = "♉",
                Dates = "20 Abril - 20 Mayo",
                Element = "Tierra",
                Color = "#4ECDC4",
                Description = "El toro. Signo de la determinación.",
                Characteristics = "Práctico, leal, paciente, terco, amante del lujo."
            },
            new ZodiacSign
            {
                Name = "Géminis",
                Symbol = "♊",
                Dates = "21 Mayo - 20 Junio",
                Element = "Aire",
                Color = "#45B7D1",
                Description = "Los gemelos. Signo de la comunicación.",
                Characteristics = "Versátil, curioso, sociable, cambiante, intelectual."
            },
            new ZodiacSign
            {
                Name = "Cáncer",
                Symbol = "♋",
                Dates = "21 Junio - 22 Julio",
                Element = "Agua",
                Color = "#96CEB4",
                Description = "El cangrejo. Signo de la sensibilidad.",
                Characteristics = "Emocional, protector, familiar, intuitivo, sensible."
            },
            new ZodiacSign
            {
                Name = "Leo",
                Symbol = "♌",
                Dates = "23 Julio - 22 Agosto",
                Element = "Fuego",
                Color = "#FECA57",
                Description = "El león. Signo del liderazgo.",
                Characteristics = "Orgulloso, generoso, dramático, carismático, creativo."
            },
            new ZodiacSign
            {
                Name = "Virgo",
                Symbol = "♍",
                Dates = "23 Agosto - 22 Septiembre",
                Element = "Tierra",
                Color = "#A8E6CF",
                Description = "La virgen. Signo de la perfección.",
                Characteristics = "Perfeccionista, analítico, servicial, crítico, detallista."
            },
            new ZodiacSign
            {
                Name = "Libra",
                Symbol = "♎",
                Dates = "23 Septiembre - 22 Octubre",
                Element = "Aire",
                Color = "#FFB3BA",
                Description = "La balanza. Signo del equilibrio.",
                Characteristics = "Diplomático, justo, social, indeciso, amante de la belleza."
            },
            new ZodiacSign
            {
                Name = "Escorpio",
                Symbol = "♏",
                Dates = "23 Octubre - 21 Noviembre",
                Element = "Agua",
                Color = "#FF8B94",
                Description = "El escorpión. Signo de la intensidad.",
                Characteristics = "Intenso, misterioso, apasionado, determinado, transformador."
            },
            new ZodiacSign
            {
                Name = "Sagitario",
                Symbol = "♐",
                Dates = "22 Noviembre - 21 Diciembre",
                Element = "Fuego",
                Color = "#B4A7D6",
                Description = "El arquero. Signo de la aventura.",
                Characteristics = "Aventurero, optimista, filosófico, independiente, directo."
            },
            new ZodiacSign
            {
                Name = "Capricornio",
                Symbol = "♑",
                Dates = "22 Diciembre - 19 Enero",
                Element = "Tierra",
                Color = "#D6EAF8",
                Description = "La cabra. Signo de la ambición.",
                Characteristics = "Ambicioso, disciplinado, práctico, responsable, tradicional."
            },
            new ZodiacSign
            {
                Name = "Acuario",
                Symbol = "♒",
                Dates = "20 Enero - 18 Febrero",
                Element = "Aire",
                Color = "#85C1E9",
                Description = "El aguador. Signo de la innovación.",
                Characteristics = "Innovador, independiente, humanitario, rebelde, visionario."
            },
            new ZodiacSign
            {
                Name = "Piscis",
                Symbol = "♓",
                Dates = "19 Febrero - 20 Marzo",
                Element = "Agua",
                Color = "#D5A6BD",
                Description = "Los peces. Signo de la intuición.",
                Characteristics = "Intuitivo, compasivo, artístico, soñador, empático."
            }
        };
    }
}
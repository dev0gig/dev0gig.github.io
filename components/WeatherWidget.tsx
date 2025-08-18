
import React, { useState, useEffect } from 'react';
import { WeatherData } from '../types';


// WMO Weather interpretation codes mapping to Google Material Symbols
const getWeatherIcon = (code: number, isDay: number): string => {
    switch (code) {
        case 0: return isDay ? 'clear_day' : 'clear_night';
        case 1: return isDay ? 'partly_cloudy_day' : 'partly_cloudy_night';
        case 2: return 'cloud';
        case 3: return 'cloudy';
        case 45:
        case 48:
            return 'foggy';
        case 51:
        case 53:
        case 55:
        case 56:
        case 57:
             return 'rainy_light';
        case 61:
        case 63:
        case 65:
            return 'rainy';
        case 66:
        case 67:
            return 'sleet';
        case 71:
        case 73:
        case 75:
        case 77:
            return 'weather_snowy';
        case 80:
        case 81:
        case 82:
            return 'rainy_heavy';
        case 95:
             return 'thunderstorm';
        case 96:
        case 99:
            return 'bolt';
        default: return 'thermostat';
    }
};


const WeatherWidget: React.FC = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            if (!navigator.geolocation) {
                setError("Geolocation wird von diesem Browser nicht unterstützt.");
                setLoading(false);
                return;
            }

            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const { latitude, longitude } = position.coords;

                    // Fetch weather data
                    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,is_day&timezone=auto`);
                    if (!weatherResponse.ok) throw new Error('Wetterdaten konnten nicht abgerufen werden.');
                    const weatherData = await weatherResponse.json();

                    // Fetch location name
                    const locationResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=de`);
                    if (!locationResponse.ok) throw new Error('Standortname konnte nicht abgerufen werden.');
                    const locationData = await locationResponse.json();
                    
                    const locationName = locationData.city || locationData.locality || 'Unbekannter Ort';
                    const icon = getWeatherIcon(weatherData.current.weather_code, weatherData.current.is_day);

                    setWeather({
                        temperature: Math.round(weatherData.current.temperature_2m),
                        location: locationName,
                        icon: icon,
                    });
                } catch (err) {
                    if (err instanceof Error) {
                        console.error("Fehler beim Abrufen der Wetterdaten:", err.message);
                    } else {
                        console.error("Fehler beim Abrufen der Wetterdaten:", err);
                    }
                    setError("Wetter konnte nicht geladen werden.");
                } finally {
                    setLoading(false);
                }
            }, (err: GeolocationPositionError) => {
                let userMessage = "Standortzugriff verweigert."; // Default for PERMISSION_DENIED (code 1)
                switch (err.code) {
                    case 2: // POSITION_UNAVAILABLE
                        userMessage = "Standort nicht verfügbar.";
                        break;
                    case 3: // TIMEOUT
                        userMessage = "Zeitüberschreitung.";
                        break;
                }
                setError(userMessage);
                setLoading(false);
                console.error(`Geolocation-Fehler (${err.code}): ${err.message}`);
            });
        };

        fetchWeather();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 rounded-full animate-spin border-4 border-dashed border-white/50 border-t-transparent"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-1">
                <span className="material-symbols-outlined text-3xl">location_off</span>
                <p className="text-xs mt-1 leading-tight font-medium">{error}</p>
            </div>
        );
    }

    if (!weather) {
        return null; // Should not happen if logic is correct
    }

    return (
        <div className="flex flex-col justify-between h-full">
            <div className="flex justify-start">
                <span className="material-symbols-outlined text-4xl">{weather.icon}</span>
            </div>
            <div className="text-right">
                <p className="text-4xl font-bold leading-none">{weather.temperature}°</p>
                <p className="text-sm truncate font-medium mt-1" title={weather.location}>{weather.location}</p>
            </div>
        </div>
    );
};

export default WeatherWidget;

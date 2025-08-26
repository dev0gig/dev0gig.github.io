import React, { useState, useEffect } from 'react';
import { getWeatherInfo, WeatherInfo } from '../utils/weather';

interface WeatherData {
    current: {
        temperature: number;
        weatherCode: number;
    };
    daily: {
        time: string[];
        weatherCode: number[];
        tempMax: number[];
        tempMin: number[];
    };
    location: string;
}

const DetailedWeather: React.FC = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // 1. Get location from IP
                const geoResponse = await fetch('https://freegeoip.app/json/');
                if (!geoResponse.ok) throw new Error('Could not fetch location data.');
                const geoData = await geoResponse.json();
                
                const { latitude: lat, longitude: lon, city } = geoData;
                if (!lat || !lon || !city) throw new Error('Location could not be determined from response.');


                // 2. Get weather for location
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=6`;
                const weatherResponse = await fetch(weatherUrl);
                if (!weatherResponse.ok) throw new Error('Could not fetch weather data.');
                const weatherData = await weatherResponse.json();
                
                setWeather({
                    current: {
                        temperature: weatherData.current.temperature_2m,
                        weatherCode: weatherData.current.weather_code,
                    },
                    daily: {
                        time: weatherData.daily.time,
                        weatherCode: weatherData.daily.weather_code,
                        tempMax: weatherData.daily.temperature_2m_max,
                        tempMin: weatherData.daily.temperature_2m_min,
                    },
                    location: city,
                });

            } catch (err: any) {
                setError(err.message || 'Failed to fetch data.');
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, []);

    const renderLoading = () => (
        <div className="flex flex-col items-center justify-center h-full text-zinc-300">
             <span className="material-symbols-outlined text-5xl mb-4 animate-spin">progress_activity</span>
            <p className="font-semibold">Lade Wetterdaten...</p>
        </div>
    );
    
    const renderError = () => (
        <div className="flex flex-col items-center justify-center h-full text-amber-300 p-4 text-center">
            <span className="material-symbols-outlined text-5xl mb-4">error</span>
            <p className="font-semibold">Fehler beim Laden</p>
            <p className="text-sm text-zinc-400">{error}</p>
        </div>
    );
    
    if (loading) return renderLoading();
    if (error || !weather) return renderError();

    const weatherInfo = getWeatherInfo(weather.current.weatherCode);

    return (
        <div className={`relative bg-gradient-to-br ${weatherInfo.gradient} rounded-2xl shadow-lg w-[24rem] text-white p-6 flex flex-col transition-all duration-500`}>
            {/* Current Weather */}
            <div className="flex-grow flex flex-col items-center text-center">
                 <p className="font-semibold text-lg">{weather.location}</p>
                <span className="material-symbols-outlined text-8xl my-4">{weatherInfo.icon}</span>
                <p className="text-6xl font-bold tracking-tighter">{Math.round(weather.current.temperature)}°</p>
                <p className="text-lg font-medium text-white/80">{weatherInfo.description}</p>
            </div>
            {/* 5-Day Forecast */}
            <div className="flex-shrink-0 mt-8 pt-6 border-t border-white/20">
                <div className="grid grid-cols-5 gap-2 text-center">
                    {weather.daily.time.slice(1).map((day, index) => {
                        const dayInfo = getWeatherInfo(weather.daily.weatherCode[index + 1]);
                        const date = new Date(day);
                        const dayName = date.toLocaleDateString('de-DE', { weekday: 'short' });
                        
                        return (
                            <div key={day} className="flex flex-col items-center p-1 bg-white/10 rounded-lg">
                                <p className="text-sm font-bold">{dayName}</p>
                                <span className="material-symbols-outlined text-3xl my-1">{dayInfo.icon}</span>
                                <div className="text-sm">
                                    <span className="font-semibold">{Math.round(weather.daily.tempMax[index + 1])}°</span>
                                    <span className="text-white/60 ml-1">{Math.round(weather.daily.tempMin[index + 1])}°</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DetailedWeather;
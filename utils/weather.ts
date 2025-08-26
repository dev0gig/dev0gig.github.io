export interface WeatherInfo {
    description: string;
    icon: string;
    gradient: string;
}

export const getWeatherInfo = (code: number): WeatherInfo => {
    switch (code) {
        case 0:
            return { description: 'Klarer Himmel', icon: 'clear_day', gradient: 'from-sky-500 to-blue-600' };
        case 1:
            return { description: 'Meistens klar', icon: 'partly_cloudy_day', gradient: 'from-sky-400 to-cyan-500' };
        case 2:
            return { description: 'Teilweise bewölkt', icon: 'partly_cloudy_day', gradient: 'from-slate-500 to-sky-600' };
        case 3:
            return { description: 'Bedeckt', icon: 'cloudy', gradient: 'from-slate-600 to-gray-700' };
        case 45:
        case 48:
            return { description: 'Nebel', icon: 'foggy', gradient: 'from-slate-400 to-gray-500' };
        case 51:
        case 53:
        case 55:
            return { description: 'Nieselregen', icon: 'rainy', gradient: 'from-slate-500 to-blue-700' };
        case 56:
        case 57:
            return { description: 'Gefrierender Nieselregen', icon: 'ac_unit', gradient: 'from-cyan-400 to-slate-600' };
        case 61:
        case 63:
        case 65:
            return { description: 'Regen', icon: 'rainy', gradient: 'from-blue-600 to-gray-800' };
        case 66:
        case 67:
            return { description: 'Gefrierender Regen', icon: 'ac_unit', gradient: 'from-sky-500 to-slate-700' };
        case 71:
        case 73:
        case 75:
            return { description: 'Schneefall', icon: 'weather_snowy', gradient: 'from-slate-300 to-gray-500' };
        case 77:
            return { description: 'Schneekörner', icon: 'grain', gradient: 'from-slate-400 to-gray-600' };
        case 80:
        case 81:
        case 82:
            return { description: 'Regenschauer', icon: 'rainy', gradient: 'from-blue-700 to-slate-800' };
        case 85:
        case 86:
            return { description: 'Schneeschauer', icon: 'weather_snowy', gradient: 'from-slate-200 to-gray-500' };
        case 95:
            return { description: 'Gewitter', icon: 'thunderstorm', gradient: 'from-gray-800 to-indigo-900' };
        case 96:
        case 99:
            return { description: 'Gewitter mit Hagel', icon: 'thunderstorm', gradient: 'from-slate-800 to-violet-900' };
        default:
            return { description: 'Unbekannt', icon: 'help', gradient: 'from-gray-500 to-gray-700' };
    }
};

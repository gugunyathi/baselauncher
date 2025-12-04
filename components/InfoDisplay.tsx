
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useCallback } from 'react';

interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  location: string;
}

// Weather icon mapping based on condition codes
const getWeatherIcon = (condition: string): string => {
  const conditionLower = condition.toLowerCase();
  if (conditionLower.includes('clear') || conditionLower.includes('sunny')) return 'clear_day';
  if (conditionLower.includes('cloud') && conditionLower.includes('part')) return 'partly_cloudy_day';
  if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) return 'cloud';
  if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) return 'rainy';
  if (conditionLower.includes('thunder') || conditionLower.includes('storm')) return 'thunderstorm';
  if (conditionLower.includes('snow') || conditionLower.includes('sleet')) return 'weather_snowy';
  if (conditionLower.includes('fog') || conditionLower.includes('mist') || conditionLower.includes('haze')) return 'foggy';
  if (conditionLower.includes('wind')) return 'air';
  return 'partly_cloudy_day';
};

// Storage keys
const WEATHER_CACHE_KEY = 'basephone_weather_cache';
const WEATHER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Get cached weather
const getCachedWeather = (): WeatherData | null => {
  try {
    const cached = localStorage.getItem(WEATHER_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < WEATHER_CACHE_DURATION) {
        return data;
      }
    }
  } catch {
    // Ignore cache errors
  }
  return null;
};

// Save weather to cache
const cacheWeather = (data: WeatherData) => {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch {
    // Ignore cache errors
  }
};

export default function InfoDisplay() {
  const [date, setDate] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(getCachedWeather());
  const [useCelsius, setUseCelsius] = useState(true);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch weather from free API
  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    try {
      // Using Open-Meteo API (free, no API key required)
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
      );
      
      if (!response.ok) throw new Error('Weather fetch failed');
      
      const data = await response.json();
      const temp = Math.round(data.current.temperature_2m);
      const weatherCode = data.current.weather_code;
      
      // Weather code to condition mapping (WMO codes)
      const conditionMap: Record<number, string> = {
        0: 'Clear',
        1: 'Mainly Clear',
        2: 'Partly Cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Foggy',
        51: 'Light Drizzle',
        53: 'Drizzle',
        55: 'Heavy Drizzle',
        61: 'Light Rain',
        63: 'Rain',
        65: 'Heavy Rain',
        71: 'Light Snow',
        73: 'Snow',
        75: 'Heavy Snow',
        77: 'Snow Grains',
        80: 'Light Showers',
        81: 'Showers',
        82: 'Heavy Showers',
        85: 'Snow Showers',
        86: 'Heavy Snow Showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with Hail',
        99: 'Thunderstorm with Heavy Hail',
      };
      
      const condition = conditionMap[weatherCode] || 'Partly Cloudy';
      
      const weatherData: WeatherData = {
        temp,
        condition,
        icon: getWeatherIcon(condition),
        location: 'Current Location',
      };
      
      setWeather(weatherData);
      cacheWeather(weatherData);
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      // Keep showing cached data or default
    }
  }, []);

  // Get location and fetch weather
  useEffect(() => {
    // Check if we have fresh cached data
    const cached = getCachedWeather();
    if (cached) {
      setWeather(cached);
      return;
    }

    // Try to get location from Android bridge first
    if ((window as any).Android?.getLocation) {
      try {
        const locationJson = (window as any).Android.getLocation();
        const location = JSON.parse(locationJson);
        if (location.latitude && location.longitude) {
          fetchWeather(location.latitude, location.longitude);
          return;
        }
      } catch {
        // Fallback to browser geolocation
      }
    }

    // Use browser geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
          // Use a default location (San Francisco) if geolocation fails
          fetchWeather(37.7749, -122.4194);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: WEATHER_CACHE_DURATION,
        }
      );
    } else {
      // Fallback: use default location
      fetchWeather(37.7749, -122.4194);
    }

    // Refresh weather every 30 minutes
    const weatherInterval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchWeather(position.coords.latitude, position.coords.longitude);
          },
          () => {
            // Keep using cached weather
          }
        );
      }
    }, WEATHER_CACHE_DURATION);

    return () => clearInterval(weatherInterval);
  }, [fetchWeather]);

  // Detect user's temperature preference (Celsius vs Fahrenheit)
  useEffect(() => {
    // Check for locale-based preference
    const locale = navigator.language || 'en-US';
    // US, Liberia, Myanmar use Fahrenheit
    const fahrenheitLocales = ['en-US', 'en-LR', 'my-MM'];
    setUseCelsius(!fahrenheitLocales.some(l => locale.startsWith(l.split('-')[0]) && locale.includes(l.split('-')[1])));
  }, []);

  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  // Convert temperature
  const displayTemp = useCelsius 
    ? weather?.temp 
    : weather ? Math.round(weather.temp * 9/5 + 32) : null;
  const tempUnit = useCelsius ? '°C' : '°F';

  // Toggle temperature unit on tap
  const handleWeatherTap = () => {
    setUseCelsius(!useCelsius);
  };

  return (
    <div className="info-display">
      <div className="time">{timeString}</div>
      <div className="date">{dateString}</div>
      <button className="weather" onClick={handleWeatherTap} title="Tap to switch units">
        <span className="icon material-symbols-outlined">
          {weather?.icon || 'partly_cloudy_day'}
        </span>
        <span>
          {displayTemp !== null ? `${displayTemp}${tempUnit}` : '--'}
        </span>
        {weather?.condition && (
          <span className="weather-condition">{weather.condition}</span>
        )}
      </button>
      <div className="voice-hint">
        <span className="icon material-symbols-outlined">mic</span>
        <span>Try: "Send crypto", "Open WhatsApp", "Call..."</span>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { WeatherData } from '../types';
import { weatherService } from '../services/weather';

export function useCropWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await weatherService.getCropWeather();
      setWeather(data);
    } catch (err) {
      console.error('Failed to load weather:', err);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const cached = await weatherService.getCachedCropWeather();
      if (cached && !cancelled) {
        setWeather(cached);
        setIsLoading(false);
      }

      if (!cancelled) await refresh();
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return { weather, isLoading, isRefreshing, refresh };
}

export function formatWeatherAge(timestamp: number, language: 'en' | 'sw'): string {
  const mins = Math.floor((Date.now() - timestamp) / 60_000);

  if (mins < 1) {
    return language === 'sw' ? 'Sasa hivi' : 'Just now';
  }
  if (mins < 60) {
    return language === 'sw' ? `Dakika ${mins} zilizopita` : `${mins} min ago`;
  }

  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return language === 'sw' ? `Saa ${hours} zilizopita` : `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return language === 'sw' ? `Siku ${days} zilizopita` : `${days}d ago`;
}

import { WeatherData, RiskLevel, WeatherDataSource } from '../types';
import { dbService } from './db';
import { PILOT_REGION } from '../config/pilotRegion';

const FETCH_TIMEOUT_MS = 8000;

class WeatherService {
  /**
   * Returns cached weather immediately if available (for stale-while-revalidate UI).
   */
  public async getCachedCropWeather(
    locationName = PILOT_REGION.labelEn
  ): Promise<WeatherData | undefined> {
    const cached = await this.loadCachedWeather(locationName);
    if (!cached) return undefined;
    return { ...cached, dataSource: 'cached' as WeatherDataSource };
  }

  /**
   * Fetches live Open-Meteo weather for the pilot region and calculates crop disease risk.
   */
  public async getCropWeather(
    lat = PILOT_REGION.latitude,
    lng = PILOT_REGION.longitude,
    locationName = PILOT_REGION.labelEn
  ): Promise<WeatherData> {
    if (!navigator.onLine) {
      const cached = await this.loadCachedWeather(locationName);
      if (cached) {
        return { ...cached, location: locationName, dataSource: 'cached' };
      }
      return this.getStaticFallback(locationName);
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&timezone=auto`;

      const response = await this.fetchWithTimeout(url, FETCH_TIMEOUT_MS);
      if (!response.ok) {
        throw new Error('Failed to fetch from Open-Meteo weather API.');
      }

      const data = await response.json();
      const current = data.current;

      const temp = current.temperature_2m;
      const humidity = current.relative_humidity_2m;
      const rain = current.precipitation;
      const wind = current.wind_speed_10m;

      const { riskLevel, alerts } = this.calculateDiseaseRisk(temp, humidity, rain);

      const weatherResult: WeatherData = {
        location: locationName,
        temperature: temp,
        humidity: humidity,
        rainfall: rain,
        windSpeed: wind,
        riskLevel,
        riskAlerts: alerts,
        timestamp: Date.now(),
        dataSource: 'live',
      };

      await dbService.saveWeather(weatherResult).catch((err) =>
        console.error('Failed to cache weather offline:', err)
      );

      return weatherResult;
    } catch (error) {
      const isTimeout = error instanceof DOMException && error.name === 'AbortError';
      if (!isTimeout) {
        console.warn('Weather API failed. Loading offline cached weather...', error);
      }

      const cached = await this.loadCachedWeather(locationName);
      if (cached) {
        return { ...cached, location: locationName, dataSource: 'cached' };
      }

      return this.getStaticFallback(locationName);
    }
  }

  private async loadCachedWeather(locationName: string): Promise<WeatherData | undefined> {
    const cached = await dbService.getCachedWeather(locationName);
    if (cached) return cached;

    const legacyCache = await dbService.getCachedWeather('Uasin Gishu / Eldoret');
    if (legacyCache) return legacyCache;

    return undefined;
  }

  private getStaticFallback(locationName: string): WeatherData {
    return {
      location: locationName,
      temperature: 21.5,
      humidity: 68,
      rainfall: 0.2,
      windSpeed: 8.5,
      riskLevel: 'Medium',
      riskAlerts: [
        `Offline mode — showing estimated conditions for ${PILOT_REGION.town}. Monitor potato and maize fields for blight after rainfall.`,
      ],
      timestamp: Date.now(),
      dataSource: 'offline',
    };
  }

  private async fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { signal: controller.signal });
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  private calculateDiseaseRisk(temp: number, humidity: number, rain: number): { riskLevel: RiskLevel; alerts: string[] } {
    const alerts: string[] = [];
    let riskLevel: RiskLevel = 'Low';

    const isHighHumidity = humidity >= 75;
    const isModerateHumidity = humidity >= 60 && humidity < 75;
    const isOptimalIncubationTemp = temp >= 18 && temp <= 29;
    const isWarmTemp = temp > 15 && temp < 33;

    if (rain > 5) {
      alerts.push(
        `Heavy rainfall in ${PILOT_REGION.town} increases leaf wetness. Spore splash risk is high for maize and potato fields.`
      );
    }

    if (isHighHumidity && isOptimalIncubationTemp) {
      riskLevel = 'High';
      alerts.push(
        `CRITICAL: Warm humid conditions in Uasin Gishu favour Late Blight on potatoes/tomatoes and Common Rust on maize. Inspect fields today.`
      );
      alerts.push('High humidity allows fungal spores to germinate within 4–6 hours. Improve crop spacing for airflow.');
    } else if (isHighHumidity || (isModerateHumidity && isWarmTemp)) {
      riskLevel = 'Medium';
      alerts.push('Moderate moisture — Early Blight and Northern Corn Leaf Blight may develop on lower leaves.');
      alerts.push('Check bottom leaves of maize and potato for yellowing or dark spots.');
    } else {
      riskLevel = 'Low';
      alerts.push(`Current conditions in ${PILOT_REGION.town} are less favourable for fungal spread. Continue routine field checks.`);
    }

    return { riskLevel, alerts };
  }
}

export const weatherService = new WeatherService();
export default weatherService;

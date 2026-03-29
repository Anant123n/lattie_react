import { fetchWeatherApi } from 'openmeteo';
import { format, subDays, formatISO } from 'date-fns';

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";

export async function getDailyDashboardData(lat, lon, dateObj = new Date()) {
  const dateStr = format(dateObj, 'yyyy-MM-dd');
  
  const weatherParams = {
    latitude: lat,
    longitude: lon,
    start_date: dateStr,
    end_date: dateStr,
    current: ["temperature_2m", "relative_humidity_2m", "precipitation", "weather_code", "wind_speed_10m"],
    hourly: ["temperature_2m", "relative_humidity_2m", "precipitation", "visibility", "wind_speed_10m"],
    daily: ["temperature_2m_max", "temperature_2m_min", "sunrise", "sunset", "uv_index_max", "precipitation_probability_max", "wind_speed_10m_max"],
    timezone: "auto"
  };

  const aqiParams = {
    latitude: lat,
    longitude: lon,
    start_date: dateStr,
    end_date: dateStr,
    hourly: ["pm10", "pm2_5", "carbon_monoxide", "carbon_dioxide", "nitrogen_dioxide", "sulphur_dioxide"],
    timezone: "auto"
  };

  try {
    const [weatherRes, aqiRes] = await Promise.all([
      fetchWeatherApi(FORECAST_URL, weatherParams),
      fetchWeatherApi(AIR_QUALITY_URL, aqiParams)
    ]);

    const weather = weatherRes[0];
    const aqi = aqiRes[0];

    const utcOffsetSeconds = weather.utcOffsetSeconds();
    
    // Parse Current
    const current = weather.current();
    const currentVars = {
      time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
      temperature_2m: current.variables(0).value(),
      relative_humidity_2m: current.variables(1).value(),
      precipitation: current.variables(2).value(),
      weather_code: current.variables(3).value(),
      wind_speed_10m: current.variables(4).value()
    };

    // Parse Hourly Weather
    const hourly = weather.hourly();
    const hourlyTimes = Array.from(
      { length: (Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval() },
      (_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
    );
    const hourlyVars = {
      time: hourlyTimes,
      temperature_2m: hourly.variables(0).valuesArray(),
      relative_humidity_2m: hourly.variables(1).valuesArray(),
      precipitation: hourly.variables(2).valuesArray(),
      visibility: hourly.variables(3).valuesArray(),
      wind_speed_10m: hourly.variables(4).valuesArray(),
    };

    // Parse Hourly AQI
    const aqiHourly = aqi.hourly();
    const aqiHourlyVars = {
      pm10: aqiHourly.variables(0).valuesArray(),
      pm2_5: aqiHourly.variables(1).valuesArray(),
      carbon_monoxide: aqiHourly.variables(2).valuesArray(),
      carbon_dioxide: aqiHourly.variables(3).valuesArray(),
      nitrogen_dioxide: aqiHourly.variables(4).valuesArray(),
      sulphur_dioxide: aqiHourly.variables(5).valuesArray(),
    };

    // Parse Daily Weather
    const daily = weather.daily();
    const sunrise = daily.variables(2);
    const sunset = daily.variables(3);

    const dailyVars = {
      temperature_2m_max: daily.variables(0).valuesArray()[0],
      temperature_2m_min: daily.variables(1).valuesArray()[0],
      sunrise: new Date((Number(sunrise.valuesInt64(0)) + utcOffsetSeconds) * 1000),
      sunset: new Date((Number(sunset.valuesInt64(0)) + utcOffsetSeconds) * 1000),
      uv_index_max: daily.variables(4).valuesArray()[0],
      precipitation_probability_max: daily.variables(5).valuesArray()[0],
      wind_speed_10m_max: daily.variables(6).valuesArray()[0],
    };

    return {
      current: currentVars,
      hourly: hourlyVars,
      aqiHourly: aqiHourlyVars,
      daily: dailyVars
    };

  } catch (err) {
    console.error("Error fetching daily dashboard data:", err);
    throw err;
  }
}

export async function getHistoricalData(lat, lon, startDate, endDate) {
  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  const archiveParams = {
    latitude: lat,
    longitude: lon,
    start_date: startStr,
    end_date: endStr,
    daily: ["temperature_2m_mean", "temperature_2m_max", "temperature_2m_min", "sunrise", "sunset", "precipitation_sum", "wind_speed_10m_max", "wind_direction_10m_dominant"],
    timezone: "auto"
  };

  // Note: Open-Meteo's historical air quality API might have a different URL or limited availability. 
  // We'll use the Aqi historical endpoint if available.
  const aqiParams = {
    latitude: lat,
    longitude: lon,
    start_date: startStr,
    end_date: endStr,
    hourly: ["pm10", "pm2_5"],
    timezone: "auto"
  };

  try {
    const [archiveRes, aqiRes] = await Promise.all([
      fetchWeatherApi(ARCHIVE_URL, archiveParams),
      fetchWeatherApi(AIR_QUALITY_URL, aqiParams) // Trying AQI endpoint for historical.
    ]);

    const arch = archiveRes[0];
    const utcOffsetSeconds = arch.utcOffsetSeconds();
    
    // Parse Daily Historical Weather
    const daily = arch.daily();
    const dailyTimes = Array.from(
      { length: (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval() },
      (_, i) => new Date((Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) * 1000)
    );

    const meanTemp = daily.variables(0).valuesArray();
    const maxTemp = daily.variables(1).valuesArray();
    const minTemp = daily.variables(2).valuesArray();
    
    // Note: Sunrise/sunset arrays contain Int64 timestamps. We map them.
    const sunriseVar = daily.variables(3);
    const sunsetVar = daily.variables(4);
    const sunrise = [...Array(sunriseVar.valuesInt64Length())].map((_, i) => new Date((Number(sunriseVar.valuesInt64(i)) + utcOffsetSeconds) * 1000));
    const sunset = [...Array(sunsetVar.valuesInt64Length())].map((_, i) => new Date((Number(sunsetVar.valuesInt64(i)) + utcOffsetSeconds) * 1000));

    const precipitation = daily.variables(5).valuesArray();
    const windMax = daily.variables(6).valuesArray();
    const windDir = daily.variables(7).valuesArray();

    return {
      time: dailyTimes,
      meanTemp, maxTemp, minTemp,
      sunrise, sunset,
      precipitation, windMax, windDir
    };

  } catch (err) {
    console.error("Error fetching historical data:", err);
    throw err;
  }
}

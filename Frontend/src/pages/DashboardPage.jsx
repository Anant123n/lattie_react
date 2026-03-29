import { useState, useEffect } from 'react';
import { getDailyDashboardData } from '../services/weatherService';
import StatCard from '../components/StatCard';
import WeatherChart from '../components/WeatherChart';
import { format } from 'date-fns';
import { MapPin, Droplets, Thermometer, Wind, Sunrise, Sunset, Sun, CloudRain, AlertTriangle, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationName, setLocationName] = useState("Fetching Location...");

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setLocationName(`${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`);
          
          const weatherData = await getDailyDashboardData(lat, lon);
          setData(weatherData);
          setLoading(false);
        } catch (err) {
          setError("Failed to fetch weather data");
          setLoading(false);
        }
      },
      (err) => {
        setError("Location access denied. Please allow location access.");
        setLoading(false);
      }
    );
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="animate-pulse">Locating and fetching telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/50 bg-rose-500/10 p-8 text-center text-rose-400 flex flex-col items-center">
        <AlertTriangle className="w-12 h-12 mb-4 text-rose-500" />
        <h2 className="text-xl font-bold mb-2">Notice</h2>
        <p>{error}</p>
      </div>
    );
  }

  const { current, daily, hourly, aqiHourly } = data;

  const getAQIStatus = (pm25) => {
    if (pm25 <= 12) return { text: "Good", color: "emerald", dcl: "AQI" };
    if (pm25 <= 35.4) return { text: "Moderate", color: "amber", dcl: "AQI" };
    return { text: "Unhealthy", color: "rose", dcl: "AQI" };
  };
  
  const aqiStatus = getAQIStatus(aqiHourly.pm2_5[new Date().getHours()] || aqiHourly.pm2_5[0]);

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-50">Today's Telemetry</h1>
          <div className="flex items-center gap-2 text-slate-400 mt-2">
            <MapPin className="w-4 h-4 text-indigo-400" />
            <span>{locationName}</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-xs ml-2 border border-slate-700">
              {format(current.time, 'PP')}
            </span>
          </div>
        </div>
      </header>

      {/* Grid for Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Current Temperature" 
          value={`${current.temperature_2m.toFixed(1)}°C`} 
          subtitle={`Min: ${daily.temperature_2m_min.toFixed(1)}°C | Max: ${daily.temperature_2m_max.toFixed(1)}°C`}
          icon={Thermometer} color="rose"
        />
        <StatCard 
          title="Precipitation" 
          value={`${current.precipitation.toFixed(1)} mm`} 
          subtitle={`Max Probability: ${daily.precipitation_probability_max}%`}
          icon={CloudRain} color="cyan"
        />
        <StatCard 
          title="Relative Humidity" 
          value={`${current.relative_humidity_2m.toFixed(0)}%`} 
          icon={Droplets} color="indigo"
        />
        <StatCard 
          title="Wind Speed" 
          value={`${current.wind_speed_10m.toFixed(1)} km/h`} 
          subtitle={`Max today: ${daily.wind_speed_10m_max.toFixed(1)} km/h`}
          icon={Wind} color="slate"
        />
        <StatCard 
          title="Sunrise & Sunset" 
          value={format(daily.sunrise, 'HH:mm')}
          subtitle={`Sunset: ${format(daily.sunset, 'HH:mm')}`}
          icon={Sunrise} color="amber"
        />
        <StatCard 
          title="UV Index" 
          value={daily.uv_index_max.toFixed(1)} 
          subtitle="Max theoretical index"
          icon={Sun} color="purple"
        />
        <StatCard 
          title="Air Quality (PM2.5)" 
          value={`${aqiHourly.pm2_5[new Date().getHours()]?.toFixed(1) || '--'} μg/m³`} 
          subtitle={`Status: ${aqiStatus.text}`}
          icon={AlertCircle} color={aqiStatus.color}
        />
      </div>

      <div className="space-y-6 mt-10">
        <h2 className="text-2xl font-bold tracking-tight border-b border-slate-800 pb-2">Hourly Charts</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeatherChart 
            title="Temperature & Feels Like"
            type="area"
            categories={hourly.time}
            series={[
              { name: 'Temperature (°C)', data: Array.from(hourly.temperature_2m) }
            ]}
            colors={['#f43f5e']}
            yAxisTitle="°C"
          />
          
          <WeatherChart 
            title="Precipitation Probability & Amount"
            type="bar"
            categories={hourly.time}
            series={[
              { name: 'Precipitation (mm)', data: Array.from(hourly.precipitation) },
            ]}
            colors={['#06b6d4']}
            yAxisTitle="mm"
          />

          <WeatherChart 
            title="Relative Humidity"
            type="area"
            categories={hourly.time}
            series={[
              { name: 'Humidity (%)', data: Array.from(hourly.relative_humidity_2m) }
            ]}
            colors={['#818cf8']}
            yAxisTitle="%"
          />

          <WeatherChart 
            title="Wind Speed & Visibility"
            type="line"
            categories={hourly.time}
            series={[
              { name: 'Wind Speed (km/h)', data: Array.from(hourly.wind_speed_10m) }
            ]}
            colors={['#cbd5e1']}
            yAxisTitle="km/h"
          />

          <WeatherChart 
            title="Air Quality (PM10 & PM2.5)"
            type="area"
            categories={hourly.time}
            series={[
              { name: 'PM10', data: Array.from(aqiHourly.pm10) },
              { name: 'PM2.5', data: Array.from(aqiHourly.pm2_5) }
            ]}
            colors={['#fbbf24', '#f59e0b']}
            yAxisTitle="μg/m³"
          />
        </div>
      </div>
    </div>
  );
}

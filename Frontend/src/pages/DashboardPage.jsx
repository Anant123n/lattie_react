import { useState, useEffect } from 'react';
import { getDailyDashboardData } from '../services/weatherService';
import StatCard from '../components/StatCard';
import WeatherChart from '../components/WeatherChart';
import { format } from 'date-fns';
import { MapPin, Droplets, Thermometer, Wind, Sunrise, Sunset, Sun, CloudRain, AlertTriangle, AlertCircle, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationName, setLocationName] = useState("Fetching Location...");
  const [coords, setCoords] = useState(null);

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isFahrenheit, setIsFahrenheit] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLocationName(`${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`);
        setCoords({ lat, lon });
      },
      (err) => {
        setError("Location access denied. Please allow location access.");
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    if (!coords) return;
    
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const weatherData = await getDailyDashboardData(coords.lat, coords.lon, new Date(selectedDate));
        if (isMounted) {
          setData(weatherData);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to fetch weather data for the selected date.");
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, [coords, selectedDate]);

  if (!coords && loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="animate-pulse">Locating and fetching telemetry...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-rose-500/50 bg-rose-500/10 p-8 text-center text-rose-400 flex flex-col items-center">
        <AlertTriangle className="w-12 h-12 mb-4 text-rose-500" />
        <h2 className="text-xl font-bold mb-2">Notice</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="animate-pulse">Loading dataset...</p>
      </div>
    );
  }

  const { current, daily, hourly, aqiHourly } = data;

  // Helpers
  const convertTemp = (celsius) => isFahrenheit ? (celsius * 9/5) + 32 : celsius;
  const tempUnit = isFahrenheit ? '°F' : '°C';
  const getArrayMax = (arr) => Math.max(...Array.from(arr));

  const aqiMax = {
    pm10: getArrayMax(aqiHourly.pm10),
    pm25: getArrayMax(aqiHourly.pm2_5),
    co: getArrayMax(aqiHourly.carbon_monoxide),
    co2: getArrayMax(aqiHourly.carbon_dioxide),
    no2: getArrayMax(aqiHourly.nitrogen_dioxide),
    so2: getArrayMax(aqiHourly.sulphur_dioxide)
  };

  const getAQIStatus = (pm25) => {
    if (pm25 <= 12) return { text: "Good", color: "emerald", dcl: "AQI" };
    if (pm25 <= 35.4) return { text: "Moderate", color: "amber", dcl: "AQI" };
    return { text: "Unhealthy", color: "rose", dcl: "AQI" };
  };
  
  const aqiStatus = getAQIStatus(aqiMax.pm25);

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-50">Daily Telemetry</h1>
          <div className="flex items-center gap-2 text-slate-400 mt-2">
            <MapPin className="w-4 h-4 text-indigo-400" />
            <span>{locationName}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center gap-3">
             <label className="text-sm font-semibold text-slate-400 flex items-center gap-2">
               <Calendar className="w-4 h-4" />
               Select Date:
             </label>
             <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
             />
          </div>
          <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>
          <button 
             onClick={() => setIsFahrenheit(!isFahrenheit)}
             className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700"
          >
             Toggle Unit: {isFahrenheit ? 'Fahrenheit' : 'Celsius'}
          </button>
        </div>
      </header>

      {/* Grid for Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Avg / Current Temp" 
          value={`${convertTemp(current.temperature_2m).toFixed(1)}${tempUnit}`} 
          subtitle={`Min: ${convertTemp(daily.temperature_2m_min).toFixed(1)}${tempUnit} | Max: ${convertTemp(daily.temperature_2m_max).toFixed(1)}${tempUnit}`}
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
          title="Max Wind Speed" 
          value={`${daily.wind_speed_10m_max.toFixed(1)} km/h`}
          subtitle={`Current: ${current.wind_speed_10m.toFixed(1)} km/h`}
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
          title="Air Quality & PM2.5" 
          value={`${aqiMax.pm25.toFixed(1)} μg/m³`} 
          subtitle={`AQI Status: ${aqiStatus.text}`}
          icon={AlertCircle} color={aqiStatus.color}
        />
        <div className="grid grid-cols-2 gap-2">
           <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/50 flex flex-col justify-center items-center text-center">
              <span className="text-xs text-slate-400">PM10</span>
              <span className="font-bold text-slate-200">{aqiMax.pm10.toFixed(1)}</span>
           </div>
           <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/50 flex flex-col justify-center items-center text-center">
              <span className="text-xs text-slate-400">CO</span>
              <span className="font-bold text-slate-200">{aqiMax.co.toFixed(1)}</span>
           </div>
           <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/50 flex flex-col justify-center items-center text-center">
              <span className="text-xs text-slate-400">NO2</span>
              <span className="font-bold text-slate-200">{aqiMax.no2.toFixed(1)}</span>
           </div>
           <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/50 flex flex-col justify-center items-center text-center">
              <span className="text-xs text-slate-400">SO2</span>
              <span className="font-bold text-slate-200">{aqiMax.so2.toFixed(1)}</span>
           </div>
        </div>
      </div>

      <div className="space-y-6 mt-10 relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-slate-950/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
             <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        )}
        <h2 className="text-2xl font-bold tracking-tight border-b border-slate-800 pb-2">Hourly Data Graphs</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeatherChart 
            title="Temperature Trends"
            type="area"
            categories={hourly.time}
            series={[
              { name: `Temperature (${tempUnit})`, data: Array.from(hourly.temperature_2m).map(convertTemp) }
            ]}
            colors={['#f43f5e']}
            yAxisTitle={tempUnit}
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
            title="Precipitation"
            type="bar"
            categories={hourly.time}
            series={[
              { name: 'Precipitation (mm)', data: Array.from(hourly.precipitation) },
            ]}
            colors={['#06b6d4']}
            yAxisTitle="mm"
          />

          <WeatherChart 
            title="Visibility"
            type="line"
            categories={hourly.time}
            series={[
              { name: 'Visibility (m)', data: Array.from(hourly.visibility) }
            ]}
            colors={['#a78bfa']}
            yAxisTitle="Meters"
          />

          <WeatherChart 
            title="Wind Speed (10m)"
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

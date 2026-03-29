import { useState } from 'react';
import { getHistoricalData } from '../services/weatherService';
import WeatherChart from '../components/WeatherChart';
import { subDays, format, differenceInDays } from 'date-fns';
import { Calendar, AlertTriangle, History } from 'lucide-react';

export default function HistoricalPage() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetch = async (e) => {
    e?.preventDefault();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      setError("Start date cannot be after end date.");
      return;
    }
    
    // Check max 2 years range
    if (differenceInDays(end, start) > 731) {
      setError("Date range cannot exceed 2 years.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          try {
            const histData = await getHistoricalData(lat, lon, start, end);
            setData(histData);
          } catch(err) {
            setError("Failed to fetch historical data from API.");
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          setError("Location access required to fetch historical data for your area.");
          setLoading(false);
        }
      );
    } catch(err) {
      setError("System error handling location.");
      setLoading(false);
    }
  };

  const parseTimeOfDay = (dateObj) => {
    if (!dateObj || isNaN(dateObj.getTime())) return null;
    return dateObj.getHours() + (dateObj.getMinutes() / 60);
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-50">Historical Trends</h1>
          <p className="text-slate-400 mt-2">Analyze up to two years of comparative weather data.</p>
        </div>
        
        <form onSubmit={handleFetch} className="flex flex-wrap items-end gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Calendar className="w-4 h-4" />}
            Analyze Data
          </button>
        </form>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 p-4 text-rose-400 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-16 text-center text-slate-400">
          <History className="w-12 h-12 mx-auto mb-4 text-slate-600 opacity-50" />
          <p>Select a date range and click Analyze to view historical trends.</p>
        </div>
      )}

      {loading && !data && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          <p className="animate-pulse">Crunching historical data points...</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <WeatherChart 
              title="Temperature Trends (Mean, Max, Min)"
              type="line"
              categories={data.time}
              series={[
                { name: 'Max Temp (°C)', data: Array.from(data.maxTemp) },
                { name: 'Mean Temp (°C)', data: Array.from(data.meanTemp) },
                { name: 'Min Temp (°C)', data: Array.from(data.minTemp) }
              ]}
              colors={['#f43f5e', '#f59e0b', '#3b82f6']}
              yAxisTitle="°C"
            />

            <WeatherChart 
              title="Precipitation History"
              type="bar"
              categories={data.time}
              series={[
                { name: 'Daily Precipitation (mm)', data: Array.from(data.precipitation) },
              ]}
              colors={['#06b6d4']}
              yAxisTitle="mm"
            />

            <WeatherChart 
              title="Wind Max Speed & Dominant Direction"
              type="area"
              categories={data.time}
              series={[
                { name: 'Max Wind Speed (km/h)', data: Array.from(data.windMax) },
                { name: 'Dominant Direction (°)', data: Array.from(data.windDir) }
              ]}
              colors={['#cbd5e1', '#8b5cf6']}
              yAxisTitle="Value"
            />

            <WeatherChart 
              title="Sunrise & Sunset Times (Decimal Hours)"
              type="line"
              categories={data.time}
              series={[
                { name: 'Sunrise (Hr)', data: data.sunrise.map(parseTimeOfDay) },
                { name: 'Sunset (Hr)', data: data.sunset.map(parseTimeOfDay) }
              ]}
              colors={['#fbbf24', '#f97316']}
              yAxisTitle="Hour of Day"
            />
          </div>
        </div>
      )}
    </div>
  );
}

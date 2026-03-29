import React from 'react';
import Chart from 'react-apexcharts';

export default function WeatherChart({ title, series, categories, type = 'area', yAxisTitle, colors, height = 300 }) {
  const options = {
    chart: {
      type: type,
      height: height,
      fontFamily: 'inherit',
      background: 'transparent',
      toolbar: {
        show: true,
        tools: {
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
        autoSelected: 'zoom' 
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        dynamicAnimation: {
          speed: 350
        }
      }
    },
    colors: colors,
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    theme: {
      mode: 'dark',
    },
    grid: {
      borderColor: '#1e293b', // Tailwind slate-800
      strokeDashArray: 4,
    },
    xaxis: {
      categories: categories,
      type: 'datetime',
      labels: {
        style: {
          colors: '#94a3b8' // Tailwind slate-400
        },
        datetimeUTC: false,
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        color: '#334155' // Tailwind slate-700
      }
    },
    yaxis: {
      title: {
        text: yAxisTitle,
        style: {
          color: '#94a3b8'
        }
      },
      labels: {
        style: {
          colors: '#94a3b8'
        },
        formatter: (value) => {
          return value ? value.toFixed(1) : value;
        }
      }
    },
    tooltip: {
      theme: 'dark',
      x: {
        format: 'ddMMM yyyy HH:mm'
      },
      y: {
        formatter: (value) => {
          return value ? value.toFixed(2) : value;
        }
      }
    },
    fill: {
      type: type === 'area' ? 'gradient' : 'solid',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    }
  };

  return (
    <div className="bg-slate-900/40 rounded-2xl p-4 sm:p-6 border border-slate-800/50 backdrop-blur-md shadow-xl w-full">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>
      <div className="w-full overflow-hidden">
        <Chart options={options} series={series} type={type} height={height} />
      </div>
    </div>
  );
}

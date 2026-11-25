import React, { useEffect, useState } from 'react';
import { toLocalizedDigits, Language } from '../translations';
import { IconVolume2, IconShieldAlert } from './Icons';

interface ParameterGraphsProps {
  fieldId: number;
  t: Record<string, string>;
  lang: Language;
  onSpeak: (text: string) => void;
}

export const ParameterGraphs: React.FC<ParameterGraphsProps> = ({
  fieldId,
  t,
  lang,
  onSpeak,
}) => {
  const [trendsData, setTrendsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customCity, setCustomCity] = useState('');
  const [activeLocationLabel, setActiveLocationLabel] = useState<string>('');
  const [customCoords, setCustomCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Popular Tomato Growing Clusters for 1-click preview
  const popularHubs = [
    { name: 'Belagavi (Peeranwadi)', lat: 15.8200, lng: 74.4600 },
    { name: 'Kolar (APMC Market)', lat: 13.1579, lng: 78.1625 },
    { name: 'Nashik (Pimpalgaon)', lat: 20.1700, lng: 73.9800 },
    { name: 'Pune (Narayangaon)', lat: 19.1200, lng: 73.9700 },
    { name: 'Bengaluru Rural (Doddaballapur)', lat: 13.2900, lng: 77.5300 },
    { name: 'Madanapalle (AP)', lat: 13.5500, lng: 78.5000 },
    { name: 'Hubballi / Dharwad', lat: 15.3647, lng: 75.1240 },
    { name: 'Chikkaballapur', lat: 13.4325, lng: 77.7275 },
  ];

  const fetchTrends = async (overrideCoords?: { lat: number; lng: number }, label?: string) => {
    try {
      setLoading(true);
      let url = `/api/analytics/trends/${fieldId}`;
      if (overrideCoords) {
        url = `/api/analytics/trends?lat=${overrideCoords.lat}&lng=${overrideCoords.lng}&location=${encodeURIComponent(label || 'Custom Location')}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setTrendsData(data);
      if (label) {
        setActiveLocationLabel(label);
      } else {
        setActiveLocationLabel('');
      }
    } catch (err) {
      console.error('Failed to load trends:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCustomCoords(null);
    setActiveLocationLabel('');
    fetchTrends();
  }, [fieldId]);

  // Geocode user entered city name via OpenStreetMap Nominatim
  const handleCitySearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customCity.trim()) return;

    try {
      setLoading(true);
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(customCity.trim())}&limit=1`;
      const res = await fetch(geoUrl, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const found = data[0];
        const lat = parseFloat(found.lat);
        const lng = parseFloat(found.lon);
        const shortName = found.display_name.split(',').slice(0, 2).join(',');
        setCustomCoords({ lat, lng });
        await fetchTrends({ lat, lng }, shortName);
      } else {
        alert(`City or place "${customCity}" not found. Try entering nearby town or district.`);
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHub = (hub: { name: string; lat: number; lng: number }) => {
    setCustomCity(hub.name);
    setCustomCoords({ lat: hub.lat, lng: hub.lng });
    fetchTrends({ lat: hub.lat, lng: hub.lng }, hub.name);
  };

  const handleUseCurrentGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(4));
          const lng = parseFloat(pos.coords.longitude.toFixed(4));
          const label = `My GPS (${lat}°N, ${lng}°E)`;
          setCustomCity(label);
          setCustomCoords({ lat, lng });
          fetchTrends({ lat, lng }, label);
        },
        (err) => {
          alert('GPS permission denied or unavailable. Please type your city name.');
        }
      );
    }
  };

  const handleResetToFarm = () => {
    setCustomCity('');
    setCustomCoords(null);
    setActiveLocationLabel('');
    fetchTrends();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-xs text-slate-400">
        Loading 7-day parameter trend graphs...
      </div>
    );
  }

  const trends = trendsData?.trends || [];
  const maxCumDsv = 22;

  // SVG Chart dimensions
  const svgWidth = 560;
  const svgHeight = 180;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 25;
  const padBottom = 30;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  // X coordinate calculation
  const getX = (idx: number) => {
    return padLeft + (idx / Math.max(1, trends.length - 1)) * plotWidth;
  };

  // 1. DSV Points & Path
  const dsvPoints = trends.map((pt: any, idx: number) => {
    const x = getX(idx);
    const y = padTop + plotHeight - (pt.dsv_cum / maxCumDsv) * plotHeight;
    return { x, y, cum: pt.dsv_cum, daily: pt.dsv_daily, label: pt.day_label };
  });

  const dsvPathD = dsvPoints.length > 0
    ? `M ${dsvPoints.map((p: any) => `${p.x},${p.y}`).join(' L ')}`
    : '';

  // Threshold 15 Y coordinate
  const yThreshold15 = padTop + plotHeight - (15 / maxCumDsv) * plotHeight;

  // 2. Temp & Humidity points
  const tempPoints = trends.map((pt: any, idx: number) => {
    const x = getX(idx);
    // temp scale 15 to 30 C
    const y = padTop + plotHeight - ((pt.temp_c - 15) / 15) * plotHeight;
    return { x, y, temp: pt.temp_c, hum: pt.humidity_pct, label: pt.day_label };
  });
  const tempPathD = tempPoints.length > 0
    ? `M ${tempPoints.map((p: any) => `${p.x},${p.y}`).join(' L ')}`
    : '';

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg md:text-xl font-bold text-slate-900">
              {t.graphsTitle}
            </h2>
            {activeLocationLabel ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                📍 {activeLocationLabel}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                🌿 Farm Plot GPS
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.graphsSubtitle}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeLocationLabel && (
            <button
              onClick={handleResetToFarm}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200 cursor-pointer"
              title="Reset graphs back to active farm coordinates"
            >
              🔄 Reset to Farm
            </button>
          )}

          <button
            onClick={() => onSpeak(`${t.graphsTitle}. ${trendsData?.summary_advisory || ''}`)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200 cursor-pointer"
          >
            <IconVolume2 className="w-4 h-4 text-emerald-600" />
            <span>{t.readAloud}</span>
          </button>
        </div>
      </div>

      {/* Live City / Location Selector & Search Bar */}
      <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-3.5 my-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <form onSubmit={handleCitySearch} className="flex-1 flex items-center space-x-1.5">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter any city, taluk, village or district (e.g. Belgaum, Nashik, Kolar, Pune)..."
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                className="w-full bg-white pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 placeholder:text-slate-400"
              />
              <span className="absolute left-2.5 top-2 text-xs text-slate-400">🔍</span>
            </div>
            <button
              type="submit"
              disabled={loading || !customCity.trim()}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex-shrink-0"
            >
              {loading ? 'Fetching...' : 'Check Trends'}
            </button>
          </form>

          <button
            onClick={handleUseCurrentGPS}
            type="button"
            className="px-3 py-1.5 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center space-x-1 flex-shrink-0"
            title="Fetch real-time weather from your current device GPS"
          >
            <span>🎯</span>
            <span>Use My Live GPS</span>
          </button>
        </div>

        {/* Quick Location Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-200/60">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">
            Quick Hubs:
          </span>
          {popularHubs.map((hub) => (
            <button
              key={hub.name}
              type="button"
              onClick={() => handleSelectHub(hub)}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-medium transition cursor-pointer border ${
                activeLocationLabel === hub.name
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-slate-200'
              }`}
            >
              {hub.name}
            </button>
          ))}
        </div>
      </div>

      {/* Advisory Alert Banner */}
      {trendsData?.summary_advisory && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 my-5 text-xs text-amber-950 flex items-start space-x-3">
          <IconShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold mb-0.5">7-Day Infection Trend Evaluation:</strong>
            <span>{trendsData.summary_advisory}</span>
          </div>
        </div>
      )}

      {/* 4 Interactive SVG Visual Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-4">
        {/* Graph 1: Tom-Cast 5-Day Cumulative Infection Curve */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-800">
              {t.graphDsvTitle}
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-200">
              {t.dsvThreshold15}
            </span>
          </div>

          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto min-w-[340px]">
              {/* Critical Danger Zone Shade above 15 */}
              <rect
                x={padLeft}
                y={padTop}
                width={plotWidth}
                height={Math.max(0, yThreshold15 - padTop)}
                fill="#fee2e2"
                opacity="0.5"
              />
              {/* Safe Zone Shade below 15 */}
              <rect
                x={padLeft}
                y={yThreshold15}
                width={plotWidth}
                height={padTop + plotHeight - yThreshold15}
                fill="#dcfce7"
                opacity="0.3"
              />

              {/* Threshold 15 Dashed Line */}
              <line
                x1={padLeft}
                y1={yThreshold15}
                x2={padLeft + plotWidth}
                y2={yThreshold15}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="4,3"
              />
              <text x={padLeft + 4} y={yThreshold15 - 4} fill="#b91c1c" fontSize="10" fontWeight="bold">
                Threshold: 15 DSV
              </text>

              {/* Y Axis Grid lines */}
              {[0, 5, 10, 15, 20].map((val) => {
                const y = padTop + plotHeight - (val / maxCumDsv) * plotHeight;
                return (
                  <g key={val}>
                    <line x1={padLeft} y1={y} x2={padLeft + plotWidth} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                    <text x={padLeft - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
                      {toLocalizedDigits(val, lang)}
                    </text>
                  </g>
                );
              })}

              {/* Curve Line */}
              <path d={dsvPathD} fill="none" stroke="#047857" strokeWidth="3" />

              {/* Points */}
              {dsvPoints.map((pt: any, idx: number) => {
                const isOver = pt.cum >= 15;
                return (
                  <g key={idx}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      fill={isOver ? '#ef4444' : '#10b981'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 7}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill={isOver ? '#b91c1c' : '#065f46'}
                    >
                      {toLocalizedDigits(pt.cum, lang)}
                    </text>
                    <text
                      x={pt.x}
                      y={svgHeight - 10}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#64748b"
                      fontWeight="500"
                    >
                      {pt.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
            <span>● Green: Cumulative DSV &lt; 15</span>
            <span className="text-rose-700 font-bold">● Red: Cumulative DSV ≥ 15 (Spray Required)</span>
          </div>
        </div>

        {/* Graph 2: Temperature & Relative Humidity Curve */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-800">
              {t.graphTempHumTitle}
            </h4>
            <div className="flex items-center space-x-2 text-[10px]">
              <span className="text-amber-700 font-bold">● Temp (°C)</span>
              <span className="text-blue-700 font-bold">● Humidity (%)</span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto min-w-[340px]">
              {/* Y Axis Grid lines */}
              {[15, 20, 25, 30].map((val) => {
                const y = padTop + plotHeight - ((val - 15) / 15) * plotHeight;
                return (
                  <g key={val}>
                    <line x1={padLeft} y1={y} x2={padLeft + plotWidth} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                    <text x={padLeft - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
                      {toLocalizedDigits(val, lang)}°C
                    </text>
                  </g>
                );
              })}

              {/* Temperature Line */}
              <path d={tempPathD} fill="none" stroke="#d97706" strokeWidth="2.5" />

              {/* Points */}
              {tempPoints.map((pt: any, idx: number) => (
                <g key={idx}>
                  <circle cx={pt.x} cy={pt.y} r="3.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                  <text x={pt.x} y={pt.y - 6} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#b45309">
                    {toLocalizedDigits(pt.temp.toFixed(1), lang)}°
                  </text>
                  <text x={pt.x} y={svgHeight - 10} textAnchor="middle" fontSize="9" fill="#64748b">
                    {pt.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="text-[10px] text-slate-500 pt-1">
            Fungal germination requires optimal 22°C - 26°C with &gt;85% Relative Humidity.
          </div>
        </div>

        {/* Graph 3: Leaf Wetness Duration (Hours/Day) */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-800">
              {t.graphWetnessTitle}
            </h4>
            <span className="text-[10px] text-slate-500 font-medium">EDPD Dew-Point Model</span>
          </div>

          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto min-w-[340px]">
              {/* Max wetness scale 0 to 14 hrs */}
              {[0, 3, 6, 9, 12].map((val) => {
                const y = padTop + plotHeight - (val / 14) * plotHeight;
                return (
                  <g key={val}>
                    <line x1={padLeft} y1={y} x2={padLeft + plotWidth} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                    <text x={padLeft - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
                      {toLocalizedDigits(val, lang)}h
                    </text>
                  </g>
                );
              })}

              {/* Bar columns */}
              {trends.map((pt: any, idx: number) => {
                const x = getX(idx) - 14;
                const barH = (pt.wet_hours / 14) * plotHeight;
                const y = padTop + plotHeight - barH;
                const isHighWet = pt.wet_hours >= 10.0;

                return (
                  <g key={idx}>
                    <rect
                      x={x}
                      y={y}
                      width="28"
                      height={barH}
                      rx="4"
                      fill={isHighWet ? '#f87171' : pt.wet_hours >= 6 ? '#fbbf24' : '#34d399'}
                    />
                    <text x={x + 14} y={y - 4} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#334155">
                      {toLocalizedDigits(pt.wet_hours.toFixed(1), lang)}h
                    </text>
                    <text x={x + 14} y={svgHeight - 10} textAnchor="middle" fontSize="9" fill="#64748b">
                      {pt.day_label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="text-[10px] text-slate-500 pt-1">
            &gt;10 hrs continuous wetness triggers 3-4 DSV rapid disease escalation.
          </div>
        </div>

        {/* Graph 4: Sentinel-2 NDRE & NDVI Canopy Indices */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-800">
              {t.graphSatelliteTitle}
            </h4>
            <div className="flex items-center space-x-2 text-[10px]">
              <span className="text-emerald-700 font-bold">● NDVI (10m)</span>
              <span className="text-indigo-700 font-bold">● NDRE Red-Edge (20m)</span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto min-w-[340px]">
              {/* Indices scale 0.0 to 1.0 */}
              {[0.2, 0.4, 0.6, 0.8].map((val) => {
                const y = padTop + plotHeight - (val / 1.0) * plotHeight;
                return (
                  <g key={val}>
                    <line x1={padLeft} y1={y} x2={padLeft + plotWidth} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                    <text x={padLeft - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
                      {toLocalizedDigits(val.toFixed(1), lang)}
                    </text>
                  </g>
                );
              })}

              {/* NDVI Line */}
              {trends.map((pt: any, idx: number) => {
                const x = getX(idx);
                const yNdvi = padTop + plotHeight - (pt.ndvi / 1.0) * plotHeight;
                const yNdre = padTop + plotHeight - (pt.ndre / 1.0) * plotHeight;

                return (
                  <g key={idx}>
                    <circle cx={x} cy={yNdvi} r="3" fill="#059669" />
                    <circle cx={x} cy={yNdre} r="3" fill="#4f46e5" />
                    <text x={x} y={svgHeight - 10} textAnchor="middle" fontSize="9" fill="#64748b">
                      {pt.day_label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="text-[10px] text-slate-500 pt-1">
            Red-Edge NDRE (Band 5 @ 705nm) drops 3-4 days before visible leaf chlorosis.
          </div>
        </div>
      </div>
    </div>
  );
};

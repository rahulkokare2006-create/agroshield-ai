import React, { useState, useEffect, useRef } from 'react';
import { toLocalizedDigits, Language } from '../translations';

declare const L: any;

interface AddFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFarmAdded: (newFarm: any) => void;
  userId: number;
  t: Record<string, string>;
  lang: Language;
}

// Spherical geodesic polygon area calculation (returns m²)
function computeGeodesicPolygonArea(coords: number[][]): number {
  if (coords.length < 3) return 0;
  const R = 6378137; // Earth's radius in meters
  let area = 0;

  for (let i = 0; i < coords.length; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % coords.length];

    const lat1 = (p1[0] * Math.PI) / 180;
    const lat2 = (p2[0] * Math.PI) / 180;
    const dLng = ((p2[1] - p1[1]) * Math.PI) / 180;

    area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = Math.abs((area * R * R) / 2.0);
  return area;
}

export const AddFarmModal: React.FC<AddFarmModalProps> = ({
  isOpen,
  onClose,
  onFarmAdded,
  userId,
  t,
  lang,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Coordinates
  const [centerLat, setCenterLat] = useState(15.8200);
  const [centerLng, setCenterLng] = useState(74.4600);
  const [isLocating, setIsLocating] = useState(false);

  // Polygon corners placed by farmer on satellite map (up to 10 pins)
  const [corners, setCorners] = useState<number[][]>([]);
  const [selectedCornerIdx, setSelectedCornerIdx] = useState<number>(0);
  const [shapeMode, setShapeMode] = useState<'square' | 'circle' | 'custom'>('square');

  // Calculated metrics
  const [areaM2, setAreaM2] = useState<number>(0);
  const [areaAcres, setAreaAcres] = useState<number>(1.2);
  const [areaGuntas, setAreaGuntas] = useState<number>(8);

  // Agronomic metadata
  const [fieldName, setFieldName] = useState('New Tomato Plot');
  const [tomatoVariety, setTomatoVariety] = useState('Arka Rakshak (ICAR-IIHR Hybrid)');
  const [plantingDate, setPlantingDate] = useState('2026-10-15');
  const [irrigationType, setIrrigationType] = useState('Drip Lateral System');
  const [soilType, setSoilType] = useState('Red Sandy Loam');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Generate Square or Circular (10-pin) polygon around lat/lng with given acres
  const generateShapeCoords = (shape: 'square' | 'circle', acres: number, cLat: number, cLng: number): number[][] => {
    const targetM2 = Math.max(100, acres * 4046.86);
    const radLat = (cLat * Math.PI) / 180;
    const mPerDegLat = 111132.95;
    const mPerDegLng = 111132.95 * Math.cos(radLat);

    if (shape === 'square') {
      const halfSide = Math.sqrt(targetM2) / 2.0;
      const dLat = halfSide / mPerDegLat;
      const dLng = halfSide / mPerDegLng;
      return [
        [parseFloat((cLat - dLat).toFixed(6)), parseFloat((cLng - dLng).toFixed(6))],
        [parseFloat((cLat - dLat).toFixed(6)), parseFloat((cLng + dLng).toFixed(6))],
        [parseFloat((cLat + dLat).toFixed(6)), parseFloat((cLng + dLng).toFixed(6))],
        [parseFloat((cLat + dLat).toFixed(6)), parseFloat((cLng - dLng).toFixed(6))],
      ];
    } else {
      // 10 pins arranged in a circle/ellipse
      const radius = Math.sqrt(targetM2 / Math.PI);
      const rLat = radius / mPerDegLat;
      const rLng = radius / mPerDegLng;
      const pts: number[][] = [];
      const numPins = 10;
      for (let i = 0; i < numPins; i++) {
        const theta = (i * 2 * Math.PI) / numPins;
        const pLat = parseFloat((cLat + rLat * Math.sin(theta)).toFixed(6));
        const pLng = parseFloat((cLng + rLng * Math.cos(theta)).toFixed(6));
        pts.push([pLat, pLng]);
      }
      return pts;
    }
  };

  // Update polygon area whenever corners change
  useEffect(() => {
    if (corners.length >= 3) {
      const m2 = computeGeodesicPolygonArea(corners);
      setAreaM2(m2);
      const acres = m2 / 4046.86;
      setAreaAcres(parseFloat(acres.toFixed(2)));
      const guntas = Math.round((acres - Math.floor(acres)) * 40);
      setAreaGuntas(guntas);
    } else {
      setAreaM2(0);
    }
  }, [corners]);

  // Auto-fetch GPS on initial mount if available
  useEffect(() => {
    if (isOpen) {
      handleAutoFetchGPS();
    }
  }, [isOpen]);

  const handleAutoFetchGPS = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const uLat = parseFloat(pos.coords.latitude.toFixed(6));
        const uLng = parseFloat(pos.coords.longitude.toFixed(6));
        if (isNaN(uLat) || isNaN(uLng) || uLat === 0 || uLng === 0) return;
        setCenterLat(uLat);
        setCenterLng(uLng);
        const newCoords = generateShapeCoords(shapeMode === 'circle' ? 'circle' : 'square', areaAcres, uLat, uLng);
        setCorners(newCoords);
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.flyTo([uLat, uLng], 17, { duration: 1.2 });
          } catch (e) {
            console.warn('Map flyTo notice:', e);
          }
        }
      },
      (err) => {
        console.warn('Geolocation notice:', err.message);
        setIsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: false, maximumAge: 60000 }
    );
  };

  // Initialize or re-render map when modal opens
  useEffect(() => {
    if (!isOpen) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;
      if (typeof L === 'undefined') return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [centerLat, centerLng],
          zoom: 17,
          zoomControl: true,
          attributionControl: false,
        });

        // High-resolution Esri World Imagery (Satellite tiles)
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19,
          attribution: 'Esri World Imagery',
        }).addTo(map);

        // Map Click Listener to Drop Boundary Corners (up to 10 pins)
        map.on('click', (e: any) => {
          setCorners((prev) => {
            if (prev.length >= 10) {
              alert('Maximum 10 marking pins reached. Drag pins to adjust shape.');
              return prev;
            }
            const newPt = [parseFloat(e.latlng.lat.toFixed(6)), parseFloat(e.latlng.lng.toFixed(6))];
            return [...prev, newPt];
          });
        });

        mapInstanceRef.current = map;
        
        // Force tile redraw when modal opens
        setTimeout(() => {
          map.invalidateSize();
        }, 150);
      } else {
        mapInstanceRef.current.invalidateSize();
      }

      // Default shape if corners is empty
      if (corners.length === 0) {
        const initial = generateShapeCoords('square', areaAcres, centerLat, centerLng);
        setCorners(initial);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Sync Leaflet Layers with current corners state (DRAGGABLE MARKERS up to 10 pins)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (typeof L === 'undefined') return;
    const map = mapInstanceRef.current;

    // Clear previous markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }

    if (corners.length >= 3) {
      const poly = L.polygon(corners, {
        color: '#10b981',
        weight: 3.5,
        fillColor: '#059669',
        fillOpacity: 0.28,
      }).addTo(map);
      polygonLayerRef.current = poly;
    }

    // Custom Draggable Icon with Corner Number (Supports 10 pins)
    corners.forEach((pt, idx) => {
      const isSelected = idx === selectedCornerIdx;
      const cornerIcon = L.divIcon({
        className: 'field-corner-pin',
        html: `
          <div style="
            width: ${isSelected ? '32px' : '26px'};
            height: ${isSelected ? '32px' : '26px'};
            border-radius: 50%;
            background-color: ${isSelected ? '#e11d48' : '#f59e0b'};
            border: 3px solid #ffffff;
            box-shadow: 0 4px 8px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: ${isSelected ? '12px' : '11px'};
            font-weight: 800;
            cursor: grab;
          ">
            ${idx + 1}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker(pt, {
        draggable: true,
        icon: cornerIcon,
      }).addTo(map);

      marker.on('click', (e: any) => {
        L.DomEvent.stopPropagation(e);
        setSelectedCornerIdx(idx);
      });

      marker.on('drag', (e: any) => {
        const lat = parseFloat(e.target.getLatLng().lat.toFixed(6));
        const lng = parseFloat(e.target.getLatLng().lng.toFixed(6));
        setCorners((prev) => {
          const updated = [...prev];
          updated[idx] = [lat, lng];
          if (polygonLayerRef.current) {
            polygonLayerRef.current.setLatLngs(updated);
          }
          return updated;
        });
      });

      markersRef.current.push(marker);
    });
  }, [corners, selectedCornerIdx]);

  const handleApplyShape = (shape: 'square' | 'circle') => {
    setShapeMode(shape);
    const newPts = generateShapeCoords(shape, areaAcres, centerLat, centerLng);
    setCorners(newPts);
    if (mapInstanceRef.current && polygonLayerRef.current) {
      try {
        const b = L.polygon(newPts).getBounds();
        if (b.isValid()) mapInstanceRef.current.fitBounds(b, { padding: [40, 40], maxZoom: 18 });
      } catch (e) {}
    }
  };

  const handleAreaChange = (val: number) => {
    setAreaAcres(val);
    setAreaGuntas(Math.round((val - Math.floor(val)) * 40));
    if (val > 0) {
      const newPts = generateShapeCoords(shapeMode === 'circle' ? 'circle' : 'square', val, centerLat, centerLng);
      setCorners(newPts);
    }
  };

  const handleLatLngChange = (latVal: number, lngVal: number) => {
    setCenterLat(latVal);
    setCenterLng(lngVal);
    const newPts = generateShapeCoords(shapeMode === 'circle' ? 'circle' : 'square', areaAcres, latVal, lngVal);
    setCorners(newPts);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([latVal, lngVal]);
    }
  };

  const handleClearPins = () => {
    setCorners([]);
    setSelectedCornerIdx(0);
  };

  const handleUndoCorner = () => {
    setCorners((prev) => prev.slice(0, -1));
    if (selectedCornerIdx >= corners.length - 1) {
      setSelectedCornerIdx(Math.max(0, corners.length - 2));
    }
  };

  const handleNudge = (dLat: number, dLng: number) => {
    if (corners.length === 0) return;
    const updated = corners.map((pt, i) => {
      if (i === selectedCornerIdx) {
        return [parseFloat((pt[0] + dLat).toFixed(6)), parseFloat((pt[1] + dLng).toFixed(6))];
      }
      return pt;
    });
    setCorners(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (corners.length < 3) {
      setErrorMsg('Please place at least 3 pins on the map to define your plot boundary.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const computedLat = corners.reduce((acc, curr) => acc + curr[0], 0) / corners.length;
      const computedLng = corners.reduce((acc, curr) => acc + curr[1], 0) / corners.length;

      const payload = {
        user_id: userId,
        field_name: fieldName,
        boundary_geojson: corners,
        center_lat: parseFloat(computedLat.toFixed(6)),
        center_lng: parseFloat(computedLng.toFixed(6)),
        area_acres: areaAcres,
        tomato_variety: tomatoVariety,
        planting_date: plantingDate,
        irrigation_type: irrigationType,
        soil_type: soilType,
      };

      const res = await fetch('/api/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Failed to save farm plot');
      }

      const data = await res.json();
      const newFarm = {
        id: data.field_id,
        user_id: userId,
        field_name: payload.field_name,
        boundary_geojson: payload.boundary_geojson,
        center_lat: payload.center_lat,
        center_lng: payload.center_lng,
        area_acres: payload.area_acres,
        crop_type: 'Tomato',
        tomato_variety: payload.tomato_variety,
        planting_date: payload.planting_date,
        irrigation_type: payload.irrigation_type,
        soil_type: payload.soil_type,
      };

      onFarmAdded(newFarm);
      onClose();
    } catch (err: any) {
      console.error('Failed to create field:', err);
      setErrorMsg('Error saving farm to database: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 relative my-6 max-h-[94vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg font-bold w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 rounded-2xl bg-emerald-600 text-white text-xl font-bold shadow-md shadow-emerald-600/30">
            🌱
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {t.addFarmModalTitle || 'Add New Farm Plot'}
            </h2>
            <p className="text-xs text-slate-500">
              Auto-generate Square/Circle or place up to 10 pins directly on satellite imagery.
            </p>
          </div>
        </div>

        {/* Quick GPS & Region Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleAutoFetchGPS}
              disabled={isLocating}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isLocating ? '⏳' : '📍'}</span>
              <span>{isLocating ? 'Detecting Location...' : 'Auto-Fetch My GPS Location'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400">Quick Region:</span>
            {[
              { label: 'Belgaum (ಬೆಳಗಾವಿ)', lat: 15.8200, lng: 74.4600, name: 'Belgaum Tomato Farm' },
              { label: 'Kolar (ಕೋಲಾರ)', lat: 13.1582, lng: 78.1622, name: 'Kolar Tomato Plot' },
              { label: 'Bangalore Rural', lat: 13.2300, lng: 77.5800, name: 'Doddaballapur Plot' },
            ].map((reg) => (
              <button
                key={reg.name}
                type="button"
                onClick={() => {
                  setFieldName(reg.name);
                  handleLatLngChange(reg.lat, reg.lng);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([reg.lat, reg.lng], 17, { duration: 1.2 });
                  }
                }}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-50 hover:text-emerald-700 font-bold text-slate-700 border border-slate-200 transition cursor-pointer text-[11px]"
              >
                {reg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Satellite Map Container */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md mb-3 bg-slate-900">
          <div ref={mapContainerRef} className="w-full h-[320px] md:h-[380px]" />

          {/* Top Floating Controls */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
            <div className="bg-slate-900/90 text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl border border-white/20 backdrop-blur-md shadow-md pointer-events-auto">
              🛰️ Click map to add pins (Up to 10 pins) • Currently: <strong>{corners.length} Pins</strong>
            </div>

            <div className="flex items-center space-x-2 pointer-events-auto">
              <button
                type="button"
                onClick={handleUndoCorner}
                disabled={corners.length === 0}
                className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-white/20 shadow-md disabled:opacity-40 transition cursor-pointer"
              >
                ↩ Undo Last Pin
              </button>
              <button
                type="button"
                onClick={handleClearPins}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
              >
                ✕ Clear All Pins
              </button>
            </div>
          </div>

          {/* Calculated Area Floating Pill */}
          <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-emerald-400 text-white z-10 shadow-lg">
            <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">
              {t.calculatedAreaLabel || 'Calculated Exact Area'}
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-base md:text-lg font-black text-white">
                {toLocalizedDigits(areaAcres, lang)} Plot Area
              </span>
              <span className="text-xs text-emerald-300 font-bold">
                ({toLocalizedDigits(Math.floor(areaAcres), lang)} Acre {toLocalizedDigits(areaGuntas, lang)} Guntas)
              </span>
              <span className="text-[10px] text-slate-400">
                • {toLocalizedDigits(Math.round(areaM2), lang)} m²
              </span>
            </div>
          </div>
        </div>

        {/* Shape Generator Bar: Square vs Circle (10-Pin Circular Plot) */}
        <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 mb-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-emerald-950">
              ⚡ Auto-Generate Boundary Shape:
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => handleApplyShape('square')}
                className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer flex items-center space-x-1 ${
                  shapeMode === 'square'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>⬛</span>
                <span>Square (4 Pins)</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyShape('circle')}
                className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer flex items-center space-x-1 ${
                  shapeMode === 'circle'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>🔴</span>
                <span>Circular Plot (10 Pins)</span>
              </button>
            </div>
          </div>

          {/* Latitude & Longitude Direct Inputs */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-slate-600">GPS:</span>
            <input
              type="number"
              step="any"
              value={centerLat}
              onChange={(e) => handleLatLngChange(parseFloat(e.target.value) || 0, centerLng)}
              className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-mono text-[11px]"
              title="Center Latitude"
            />
            <input
              type="number"
              step="any"
              value={centerLng}
              onChange={(e) => handleLatLngChange(centerLat, parseFloat(e.target.value) || 0)}
              className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-mono text-[11px]"
              title="Center Longitude"
            />
          </div>
        </div>

        {/* Precision Directional Nudge Pad (Supports up to 10 pins) */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">
              Move Pin #{selectedCornerIdx + 1}:
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {corners.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedCornerIdx(i)}
                  className={`w-6 h-6 rounded-lg font-bold text-xs transition cursor-pointer ${
                    i === selectedCornerIdx
                      ? 'bg-amber-500 text-white shadow-xs scale-105'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Directional Arrows */}
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => handleNudge(0, -0.0001)}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200 shadow-xs flex items-center space-x-1 cursor-pointer"
            >
              <span>◀</span>
              <span>Left</span>
            </button>
            <button
              type="button"
              onClick={() => handleNudge(0.0001, 0)}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200 shadow-xs flex items-center space-x-1 cursor-pointer"
            >
              <span>▲</span>
              <span>Up</span>
            </button>
            <button
              type="button"
              onClick={() => handleNudge(-0.0001, 0)}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200 shadow-xs flex items-center space-x-1 cursor-pointer"
            >
              <span>▼</span>
              <span>Down</span>
            </button>
            <button
              type="button"
              onClick={() => handleNudge(0, 0.0001)}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200 shadow-xs flex items-center space-x-1 cursor-pointer"
            >
              <span>▶</span>
              <span>Right</span>
            </button>
          </div>
        </div>

        {/* Farm Metadata Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Explicit Farm Area Input - NO VALUE LIMIT, STEP ANY */}
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-emerald-950 text-xs">
                📐 Land Area (Auto-Regenerates Boundary Geometry)
              </span>
              <span className="text-[11px] font-semibold text-emerald-800">
                1 Acre = 40 Guntas = 4,047 m²
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Area in Acres (ಎಕರೆ / एकर)
                </label>
                {/* STEP ANY - ALLOWS ANY NUMBER LIKE 0.26, 0.12, 1.45 WITHOUT RESTRICTIONS */}
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={areaAcres}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleAreaChange(val);
                  }}
                  className="w-full bg-white border border-emerald-300 rounded-xl px-3.5 py-2 text-slate-900 font-extrabold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. 0.26"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Guntas (ಗುಂಟೆ / गुंठे)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={areaGuntas}
                  onChange={(e) => {
                    const g = parseFloat(e.target.value) || 0;
                    setAreaGuntas(g);
                    const totalAcres = parseFloat((Math.floor(areaAcres) + g / 40.0).toFixed(3));
                    handleAreaChange(totalAcres);
                  }}
                  className="w-full bg-white border border-emerald-300 rounded-xl px-3.5 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. 10"
                />
              </div>

              <div className="col-span-2 md:col-span-1 flex flex-col justify-end">
                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-950 text-center font-black">
                  {toLocalizedDigits(areaAcres, lang)} Acres ({toLocalizedDigits(Math.floor(areaAcres), lang)} Ac {toLocalizedDigits(areaGuntas, lang)} Gun)
                </div>
              </div>
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 font-bold block mb-1">
                {t.fieldNameInput}
              </label>
              <input
                type="text"
                required
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="e.g. Belgaum North Plot"
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">
                {t.varietyLabel}
              </label>
              <select
                value={tomatoVariety}
                onChange={(e) => setTomatoVariety(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="Arka Rakshak (ICAR-IIHR Triple-Disease Resistant)">
                  Arka Rakshak (ICAR-IIHR Triple-Disease Resistant)
                </option>
                <option value="Arka Vikas (Standard Desi / High-Yield)">
                  Arka Vikas (Standard Desi / High-Yield)
                </option>
                <option value="Arka Abhed (Late Blight & ToLCV Resistant)">
                  Arka Abhed (Late Blight & ToLCV Resistant)
                </option>
                <option value="Abhinav (Syngenta Commercial Hybrid)">
                  Abhinav (Syngenta Commercial Hybrid)
                </option>
                <option value="Saaho 3251 (High Yield Hybrid)">
                  Saaho 3251 (High Yield Hybrid)
                </option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">
                {t.plantingDateLabel}
              </label>
              <input
                type="date"
                required
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">
                {t.irrigationTypeLabel}
              </label>
              <select
                value={irrigationType}
                onChange={(e) => setIrrigationType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="Drip Lateral System (Roots Only)">Drip Lateral System (Roots Only - Recommended)</option>
                <option value="Overhead Sprinkler (Foliar Wetting)">Overhead Sprinkler (Foliar Wetting - High Risk)</option>
                <option value="Flood / Furrow Irrigation">Flood / Furrow Irrigation</option>
              </select>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer"
            >
              {t.cancelBtn}
            </button>
            <button
              type="submit"
              disabled={submitting || corners.length < 3}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md shadow-emerald-600/30 transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving Farm Plot...' : (t.saveFarmBtn || 'Save & Register Farm Plot')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

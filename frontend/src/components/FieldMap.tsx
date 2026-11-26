import React, { useEffect, useRef, useState } from 'react';

declare const L: any;

interface FieldMapProps {
  farmId?: number;
  centerLat: number;
  centerLng: number;
  fieldName: string;
  boundaryGeojson?: number[][];
  areaAcres?: number;
  tomatoVariety?: string;
  irrigationType?: string;
  t: Record<string, string>;
  outbreaks?: Array<{
    id: number;
    distance_km: number;
    bearing_deg: number;
    disease_name: string;
    severity: string;
  }>;
  onBoundaryUpdate?: (coords: number[][]) => void;
}

export const FieldMap: React.FC<FieldMapProps> = ({
  farmId,
  centerLat,
  centerLng,
  fieldName,
  boundaryGeojson,
  areaAcres = 1.2,
  tomatoVariety = 'Arka Rakshak',
  irrigationType = 'Drip Lateral System',
  t,
  outbreaks = [],
  onBoundaryUpdate,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const cornerMarkersRef = useRef<any[]>([]);
  const otherMarkersRef = useRef<any[]>([]);

  // Function to compute initial 4 points
  const computeInitialCoords = (): number[][] => {
    if (boundaryGeojson && Array.isArray(boundaryGeojson) && boundaryGeojson.length >= 3) {
      return boundaryGeojson;
    }
    return [
      [centerLat - 0.0010, centerLng - 0.0013],
      [centerLat - 0.0010, centerLng + 0.0015],
      [centerLat + 0.0012, centerLng + 0.0015],
      [centerLat + 0.0012, centerLng - 0.0013],
    ];
  };

  const [boundaryCoords, setBoundaryCoords] = useState<number[][]>(computeInitialCoords);
  const coordsRef = useRef<number[][]>(computeInitialCoords());
  const [isEditingBoundary, setIsEditingBoundary] = useState(false);
  const isEditingRef = useRef(false);
  const [selectedCornerIdx, setSelectedCornerIdx] = useState<number>(0);
  const selectedIdxRef = useRef<number>(0);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Keep refs in sync
  useEffect(() => {
    coordsRef.current = boundaryCoords;
  }, [boundaryCoords]);

  useEffect(() => {
    isEditingRef.current = isEditingBoundary;
  }, [isEditingBoundary]);

  useEffect(() => {
    selectedIdxRef.current = selectedCornerIdx;
  }, [selectedCornerIdx]);

  // Synchronize when farmId or center changes
  useEffect(() => {
    const coords = computeInitialCoords();
    setBoundaryCoords(coords);
    coordsRef.current = coords;
  }, [farmId, centerLat, centerLng, boundaryGeojson]);

  // 1. Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (typeof L === 'undefined') return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 17,
        zoomControl: false,
        attributionControl: false,
      });
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // REAL HIGH-RES SATELLITE: Esri World Imagery
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Esri World Imagery',
      }).addTo(map);

      // CLICK MAP TO PLACE / MOVE SELECTED PIN
      map.on('click', (e: any) => {
        if (!isEditingRef.current) return;
        const clickLat = parseFloat(e.latlng.lat.toFixed(6));
        const clickLng = parseFloat(e.latlng.lng.toFixed(6));
        const activeIdx = selectedIdxRef.current;

        const updated = [...coordsRef.current];
        updated[activeIdx] = [clickLat, clickLng];
        coordsRef.current = updated;
        setBoundaryCoords(updated);

        if (polygonRef.current) {
          polygonRef.current.setLatLngs(updated);
        }

        // Update marker position directly
        if (cornerMarkersRef.current[activeIdx]) {
          cornerMarkersRef.current[activeIdx].setLatLng([clickLat, clickLng]);
        }

        if (onBoundaryUpdate) {
          onBoundaryUpdate(updated);
        }
      });

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    map.setView([centerLat, centerLng], 17);
  }, [centerLat, centerLng]);

  // 2. Render Polygon & Markers whenever boundaryCoords or isEditingBoundary changes
  useEffect(() => {
    if (!mapInstanceRef.current || typeof L === 'undefined') return;
    const map = mapInstanceRef.current;

    // Remove existing polygon & corner markers
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
    }
    cornerMarkersRef.current.forEach((m) => map.removeLayer(m));
    cornerMarkersRef.current = [];

    // Draw field polygon
    const poly = L.polygon(boundaryCoords, {
      color: isEditingBoundary ? '#f59e0b' : '#10b981',
      weight: 3.5,
      dashArray: isEditingBoundary ? '5, 5' : undefined,
      fillColor: isEditingBoundary ? '#f59e0b' : '#059669',
      fillOpacity: isEditingBoundary ? 0.30 : 0.22,
    }).addTo(map);
    polygonRef.current = poly;

    poly.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; line-height: 1.5; padding: 4px; min-width: 170px;">
        <strong style="color: #047857; font-size: 13px;">🌾 ${fieldName}</strong><br>
        <b>${t.varietyLabel}:</b> ${tomatoVariety}<br>
        <b>${t.areaLabel}:</b> ${areaAcres} Acres<br>
        <b>${t.irrigationTypeLabel}:</b> ${irrigationType}<br>
        <span style="color: #64748b; font-size: 11px;">📍 ${centerLat.toFixed(4)}°N, ${centerLng.toFixed(4)}°E</span>
      </div>
    `);

    // Render 4 corner pins
    boundaryCoords.forEach((pt, idx) => {
      if (isEditingBoundary) {
        const isSelected = idx === selectedCornerIdx;
        const cornerIcon = L.divIcon({
          className: 'field-corner-pin',
          html: `
            <div style="
              width: ${isSelected ? '32px' : '28px'};
              height: ${isSelected ? '32px' : '28px'};
              border-radius: 50%;
              background-color: ${isSelected ? '#e11d48' : '#f59e0b'};
              border: 3px solid #ffffff;
              box-shadow: 0 4px 12px rgba(0,0,0,0.7);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-size: ${isSelected ? '13px' : '11px'};
              font-weight: 900;
              cursor: grab;
              transition: transform 0.15s ease;
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

        // DRAG: Directly update geometry without triggering full React re-render
        marker.on('drag', (e: any) => {
          const lat = parseFloat(e.target.getLatLng().lat.toFixed(6));
          const lng = parseFloat(e.target.getLatLng().lng.toFixed(6));
          coordsRef.current[idx] = [lat, lng];
          if (polygonRef.current) {
            polygonRef.current.setLatLngs(coordsRef.current);
          }
        });

        // DRAGEND: Commit state & notify parent
        marker.on('dragend', () => {
          const committed = [...coordsRef.current];
          setBoundaryCoords(committed);
          if (onBoundaryUpdate) {
            onBoundaryUpdate(committed);
          }
        });

        cornerMarkersRef.current.push(marker);
      } else {
        const marker = L.circleMarker(pt, {
          radius: 6,
          fillColor: '#10b981',
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 1,
        }).addTo(map);

        marker.bindTooltip(`Corner ${idx + 1}: ${pt[0].toFixed(5)}, ${pt[1].toFixed(5)}`, {
          permanent: false,
          direction: 'top',
        });
        cornerMarkersRef.current.push(marker);
      }
    });

    // Render center point & outbreaks once
    otherMarkersRef.current.forEach((m) => map.removeLayer(m));
    otherMarkersRef.current = [];

    const centerMarker = L.circleMarker([centerLat, centerLng], {
      radius: 8,
      fillColor: '#2563eb',
      color: '#ffffff',
      weight: 2.5,
      opacity: 1,
      fillOpacity: 1,
    }).addTo(map);
    centerMarker.bindPopup(`<b>${fieldName} (Plot Center)</b><br>${centerLat.toFixed(4)}°N, ${centerLng.toFixed(4)}°E`);
    otherMarkersRef.current.push(centerMarker);

    outbreaks.forEach((ob) => {
      const rad = (ob.bearing_deg * Math.PI) / 180.0;
      const dLat = (ob.distance_km / 111.0) * Math.cos(rad);
      const dLng = (ob.distance_km / (111.0 * Math.cos((centerLat * Math.PI) / 180.0))) * Math.sin(rad);
      const obLat = centerLat + dLat;
      const obLng = centerLng + dLng;

      const isUpwind = ob.bearing_deg >= 220 && ob.bearing_deg <= 310;
      const obMarker = L.circleMarker([obLat, obLng], {
        radius: isUpwind ? 8 : 6,
        fillColor: isUpwind ? '#ef4444' : '#f97316',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(map);

      obMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 11px;">
          <b style="color: ${isUpwind ? '#dc2626' : '#ea580c'}; font-size: 12px;">⚠️ ${ob.disease_name}</b><br>
          <b>Distance:</b> ${ob.distance_km.toFixed(1)} km<br>
          <b>Direction:</b> ${ob.bearing_deg}° (${isUpwind ? 'Directly Upwind' : 'Crosswind'})<br>
          <b>Severity:</b> ${ob.severity}
        </div>
      `);
      otherMarkersRef.current.push(obMarker);
    });
  }, [farmId, centerLat, centerLng, isEditingBoundary, selectedCornerIdx, outbreaks, t]);

  // Initial fitBounds on farm selection
  useEffect(() => {
    if (!mapInstanceRef.current || !polygonRef.current) return;
    try {
      const bounds = polygonRef.current.getBounds();
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [45, 45], maxZoom: 18 });
      }
    } catch (e) {
      // fallback
    }
  }, [farmId]);

  const handleAdjustBoundary = () => {
    if (isEditingBoundary) {
      // Saving
      if (onBoundaryUpdate) {
        onBoundaryUpdate(coordsRef.current);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setIsEditingBoundary(!isEditingBoundary);
  };

  const handleRecenter = () => {
    if (!mapInstanceRef.current || !polygonRef.current) return;
    try {
      const bounds = polygonRef.current.getBounds();
      if (bounds.isValid()) {
        mapInstanceRef.current.flyToBounds(bounds, { padding: [45, 45], maxZoom: 18, duration: 1 });
      } else {
        mapInstanceRef.current.flyTo([centerLat, centerLng], 17, { duration: 1 });
      }
    } catch (e) {
      mapInstanceRef.current.flyTo([centerLat, centerLng], 17, { duration: 1 });
    }
  };

  // Nudge individual selected vertex
  const handleShiftVertex = (dLat: number, dLng: number) => {
    const activeIdx = selectedCornerIdx;
    const updated = boundaryCoords.map((pt, i) => {
      if (i === activeIdx) return [pt[0] + dLat, pt[1] + dLng];
      return pt;
    });
    coordsRef.current = updated;
    setBoundaryCoords(updated);
    if (polygonRef.current) {
      polygonRef.current.setLatLngs(updated);
    }
    if (cornerMarkersRef.current[activeIdx]) {
      cornerMarkersRef.current[activeIdx].setLatLng(updated[activeIdx]);
    }
    if (onBoundaryUpdate) {
      onBoundaryUpdate(updated);
    }
  };

  // Move entire plot (all 4 vertices at once)
  const handleShiftEntirePlot = (dLat: number, dLng: number) => {
    const updated = boundaryCoords.map((pt) => [pt[0] + dLat, pt[1] + dLng]);
    coordsRef.current = updated;
    setBoundaryCoords(updated);
    if (polygonRef.current) {
      polygonRef.current.setLatLngs(updated);
    }
    cornerMarkersRef.current.forEach((m, i) => {
      if (m) m.setLatLng(updated[i]);
    });
    if (onBoundaryUpdate) {
      onBoundaryUpdate(updated);
    }
  };

  return (
    <div className="relative w-full h-[420px] md:h-[500px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-md">
      {/* Map Viewport */}
      <div ref={mapContainerRef} className="w-full h-full bg-slate-900 z-0" />

      {/* Floating Status / Action Pill */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 z-10 pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-white/20 text-white text-xs flex items-center space-x-1.5 shadow-lg max-w-[55%] sm:max-w-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
          <span className="font-bold whitespace-nowrap text-[11px] sm:text-xs">🛰️ Satellite</span>
          <span className="text-[10px] text-emerald-300 font-medium truncate">
            {fieldName ? fieldName.split('(')[0].trim() : ''}
          </span>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-1.5 pointer-events-auto flex-shrink-0">
          {saveSuccess && (
            <span className="bg-emerald-600 text-white font-bold text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-xl shadow-md animate-pulse">
              ✅ Saved
            </span>
          )}

          <button
            type="button"
            onClick={handleRecenter}
            className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-white/95 hover:bg-white text-slate-800 shadow-md transition flex items-center space-x-1 cursor-pointer"
            title="Re-center Satellite Map on this Farm"
          >
            <span>📍</span>
            <span className="hidden xs:inline">{t.centerLocationBtn || 'Re-Center'}</span>
          </button>

          <button
            type="button"
            onClick={handleAdjustBoundary}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold shadow-md transition flex items-center space-x-1 cursor-pointer ${
              isEditingBoundary
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold'
                : 'bg-white/95 hover:bg-white text-slate-800'
            }`}
          >
            <span>{isEditingBoundary ? '💾' : '✏️'}</span>
            <span className="truncate max-w-[80px] sm:max-w-none">
              {isEditingBoundary ? (t.saveBoundaryBtn || 'Save') : (t.editBoundaryBtn || 'Boundary')}
            </span>
          </button>
        </div>
      </div>

      {/* Easy Drag & Move Controls Drawer when Editing */}
      {isEditingBoundary && (
        <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 backdrop-blur-md p-3 md:p-4 rounded-2xl border-2 border-amber-400/70 text-white text-xs z-10 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <span className="text-amber-400 font-black">✋ Drag Any Pin Directly</span>
              <span className="text-slate-400 text-[11px] hidden sm:inline">
                or click anywhere on the satellite image to snap selected corner!
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
              Plot Area: {areaAcres} Acres
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            {/* 1. Select Corner to Move */}
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-amber-200">Select Corner:</span>
              <div className="flex items-center space-x-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedCornerIdx(i)}
                    className={`w-7 h-7 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center ${
                      selectedCornerIdx === i
                        ? 'bg-rose-600 text-white shadow-md scale-110 border-2 border-white'
                        : 'bg-white/15 text-slate-300 hover:bg-white/30'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {/* Move Selected Corner Arrows */}
              <div className="flex items-center space-x-1 pl-2 border-l border-white/20">
                <button
                  type="button"
                  onClick={() => handleShiftVertex(0, -0.00015)}
                  className="px-2 py-1 bg-white/20 hover:bg-amber-500 hover:text-black rounded-lg font-bold text-[10px] cursor-pointer"
                  title="Move Corner West"
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftVertex(0.00015, 0)}
                  className="px-2 py-1 bg-white/20 hover:bg-amber-500 hover:text-black rounded-lg font-bold text-[10px] cursor-pointer"
                  title="Move Corner North"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftVertex(-0.00015, 0)}
                  className="px-2 py-1 bg-white/20 hover:bg-amber-500 hover:text-black rounded-lg font-bold text-[10px] cursor-pointer"
                  title="Move Corner South"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftVertex(0, 0.00015)}
                  className="px-2 py-1 bg-white/20 hover:bg-amber-500 hover:text-black rounded-lg font-bold text-[10px] cursor-pointer"
                  title="Move Corner East"
                >
                  ▶
                </button>
              </div>
            </div>

            {/* 2. Move Whole Plot (All 4 Pins at once) */}
            <div className="flex items-center justify-start md:justify-end space-x-2">
              <span className="text-[11px] font-bold text-emerald-300">Move Whole Plot:</span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => handleShiftEntirePlot(0, -0.0003)}
                  className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                  title="Shift Whole Farm West"
                >
                  ◀ Left
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftEntirePlot(0.0003, 0)}
                  className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                  title="Shift Whole Farm North"
                >
                  ▲ Up
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftEntirePlot(-0.0003, 0)}
                  className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                  title="Shift Whole Farm South"
                >
                  ▼ Down
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftEntirePlot(0, 0.0003)}
                  className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                  title="Shift Whole Farm East"
                >
                  ▶ Right
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 text-[10px] text-white z-0 pointer-events-none hidden sm:block">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>{fieldName} ({areaAcres} Acres)</span>
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ml-2"></span>
          <span>Upwind Outbreak</span>
        </div>
      </div>
    </div>
  );
};

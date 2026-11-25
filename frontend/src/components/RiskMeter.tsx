import React from 'react';
import { toLocalizedDigits } from '../translations';
import { IconShieldAlert, IconDroplet, IconVolume2 } from './Icons';

interface RiskMeterProps {
  riskTier?: string;
  cumDsv?: number;
  todayDsv?: number;
  tempC?: number;
  humidityPct?: number;
  dpDepressionC?: number;
  wetHours?: number;
  bioExplanation?: string;
  actionSummary?: string;
  dataSource?: string;
  forecastTimestamp?: string;
  irrigationMode?: string;
  t: Record<string, string>;
  onToggleIrrigation: (mode: string) => void;
  onSpeak: (text: string) => void;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({
  riskTier = 'MODERATE',
  cumDsv = 12,
  todayDsv = 2,
  tempC = 23.5,
  humidityPct = 88.0,
  dpDepressionC = 1.6,
  wetHours = 8.5,
  bioExplanation = 'Microclimate conditions are favorable for fungal spore incubation.',
  actionSummary = 'Monitor lower canopy leaves. Apply approved Mancozeb 75% WP @ 2.0g/L if wetness exceeds 10 hours.',
  dataSource = 'Open-Meteo High-Resolution NWP',
  forecastTimestamp = '',
  irrigationMode = 'Drip',
  t,
  onToggleIrrigation,
  onSpeak,
}) => {
  const isHigh = riskTier === 'HIGH';
  const isMod = riskTier === 'MODERATE';

  const badgeColor = isHigh
    ? 'bg-rose-100 text-rose-800 border-rose-300'
    : isMod
    ? 'bg-amber-100 text-amber-800 border-amber-300'
    : 'bg-emerald-100 text-emerald-800 border-emerald-300';

  const riskTitle = isHigh
    ? t.riskHigh
    : isMod
    ? t.riskModerate
    : t.riskLow;

  const safeCumDsv = cumDsv ?? 12;
  const safeTodayDsv = todayDsv ?? 2;
  const safeTempC = tempC ?? 23.5;
  const safeHumidityPct = humidityPct ?? 88.0;
  const safeDpDepressionC = dpDepressionC ?? 1.6;
  const safeWetHours = wetHours ?? 8.5;

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-2xl ${isHigh ? 'bg-rose-50 text-rose-600' : isMod ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <IconShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">
              {t.weatherRiskTitle}
            </h2>
            <p className="text-xs text-slate-500">
              {t.weatherRiskSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border ${badgeColor}`}>
            {riskTitle}
          </span>
          <button
            onClick={() => onSpeak(`${riskTitle}. ${actionSummary}`)}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition cursor-pointer"
            title={t.readAloud}
          >
            <IconVolume2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-xs font-medium text-slate-500">{t.cumDsvLabel}</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900">{safeCumDsv}</span>
            <span className="text-xs text-slate-400">{t.dsvThreshold}</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${isHigh ? 'bg-rose-500' : isMod ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, (safeCumDsv / 20) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-xs font-medium text-slate-500">{t.wetHoursLabel}</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900">{safeWetHours.toFixed(1)}</span>
            <span className="text-sm font-semibold text-slate-600">{t.wetHoursUnit}</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">{t.dewModelLabel}</span>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-xs font-medium text-slate-500">{t.tempHumidityLabel}</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl font-bold text-slate-900">{safeTempC.toFixed(1)}°C</span>
            <span className="text-xs font-medium text-slate-500">/ {safeHumidityPct.toFixed(0)}% RH</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">ΔTdp: {safeDpDepressionC.toFixed(1)}°C</span>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-xs font-medium text-slate-500">{t.todayDsvLabel}</span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900">+{safeTodayDsv}</span>
            <span className="text-xs text-slate-500 font-medium">DSV</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">{t.dsvScaleLabel}</span>
        </div>
      </div>

      {/* Irrigation Check Toggle */}
      <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <IconDroplet className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-emerald-950 block">{t.irrigationCheckTitle}</span>
            <span className="text-[11px] text-emerald-700">{t.irrigationCheckDesc}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onToggleIrrigation('Drip')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              irrigationMode === 'Drip'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.dripBtn}
          </button>
          <button
            onClick={() => onToggleIrrigation('Foliar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              irrigationMode === 'Foliar'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.foliarBtn}
          </button>
        </div>
      </div>

      {/* Biological Explanation Box */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 mb-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
          {t.bioEvaluationTitle}
        </h4>
        <p className="text-sm text-slate-800 leading-relaxed font-normal">
          {bioExplanation}
        </p>
      </div>

      {/* Action Recommendation */}
      <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 mb-4 flex items-start space-x-3">
        <span className="text-xl">🌿</span>
        <div>
          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
            {t.actionGuidanceTitle}
          </h4>
          <p className="text-sm text-amber-950 font-medium mt-0.5">
            {actionSummary}
          </p>
        </div>
      </div>

      {/* Data Provenance Card */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
        <div>
          {t.dataProvenanceTitle}: <span className="text-slate-600 font-medium">{dataSource}</span>
        </div>
        <div>
          {t.weatherStationLabel}
        </div>
        <div>
          <span className="text-slate-600 font-medium">{t.microclimateMethod}</span>
        </div>
      </div>
    </div>
  );
};

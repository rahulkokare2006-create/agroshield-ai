import React from 'react';
import { IconWind, IconVolume2 } from './Icons';

interface CommunityRadarProps {
  totalReports: number;
  upwindHighRisk: number;
  proximityLevel: string;
  windSpeedKmh: number;
  windDirectionDeg: number;
  advisoryText: string;
  t: Record<string, string>;
  onSpeak: (text: string) => void;
}

export const CommunityRadar: React.FC<CommunityRadarProps> = ({
  totalReports,
  upwindHighRisk,
  proximityLevel,
  windSpeedKmh,
  windDirectionDeg,
  advisoryText,
  t,
  onSpeak,
}) => {
  const isElevated = proximityLevel === 'ELEVATED_INOCULUM_WARNING';

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 transition-all hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-2xl ${isElevated ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <IconWind className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">
              {t.communityTitle}
            </h2>
            <p className="text-xs text-slate-500">
              {t.communitySubtitle}
            </p>
          </div>
        </div>

        <button
          onClick={() => onSpeak(advisoryText)}
          className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          title={t.readAloud}
        >
          <IconVolume2 className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5">
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
          <span className="text-[11px] font-medium text-slate-400 block">{t.verifiedSightingsLabel}</span>
          <span className="text-2xl font-bold text-slate-800">{totalReports}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">ICAR KVK Network</span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
          <span className="text-[11px] font-medium text-slate-400 block">{t.upwindThreatLabel}</span>
          <span className={`text-2xl font-bold ${upwindHighRisk > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {upwindHighRisk}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">±45° Wind Cone</span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
          <span className="text-[11px] font-medium text-slate-400 block">{t.windSpeedLabel}</span>
          <span className="text-2xl font-bold text-slate-800">{windSpeedKmh} km/h</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Anemometer Vector</span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
          <span className="text-[11px] font-medium text-slate-400 block">{t.windDirectionLabel}</span>
          <span className="text-2xl font-bold text-slate-800">W (265°)</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">West to East (Westerlies)</span>
        </div>
      </div>

      <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
        isElevated ? 'bg-amber-50/70 border-amber-200 text-amber-950 font-medium' : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}>
        <strong className="block mb-1 text-slate-900 font-bold">{t.neighborAdvisoryTitle}</strong>
        {advisoryText}
      </div>
    </div>
  );
};

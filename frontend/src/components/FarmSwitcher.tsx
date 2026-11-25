import React, { useState } from 'react';
import { toLocalizedDigits, Language } from '../translations';
import { IconSprout } from './Icons';

interface FarmSwitcherProps {
  farms: any[];
  activeFarm: any;
  onSelectFarm: (farm: any) => void;
  onAddNewFarm: () => void;
  t: Record<string, string>;
  lang: Language;
}

export const FarmSwitcher: React.FC<FarmSwitcherProps> = ({
  farms,
  activeFarm,
  onSelectFarm,
  onAddNewFarm,
  t,
  lang,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-50 transition shadow-xs cursor-pointer"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span className="max-w-[140px] md:max-w-[200px] truncate">
          {activeFarm?.field_name || t.currentActiveFarm}
        </span>
        <span className="text-[10px] text-slate-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white shadow-xl border border-slate-200 py-2 z-40 text-xs animate-fadeIn">
          <div className="px-3.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {t.switchFarmBtn}
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
            {farms.map((farm) => {
              const isSelected = farm.id === activeFarm?.id;
              return (
                <button
                  key={farm.id}
                  onClick={() => {
                    onSelectFarm(farm);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 transition flex items-center justify-between cursor-pointer ${
                    isSelected ? 'bg-emerald-50/80 text-emerald-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <span className="block font-semibold">{farm.field_name}</span>
                    <span className="text-[10px] text-slate-400">
                      {toLocalizedDigits(farm.area_acres, lang)} Acres • {farm.tomato_variety}
                    </span>
                  </div>
                  {isSelected && <span className="text-emerald-600 font-bold">✓</span>}
                </button>
              );
            })}
          </div>

          <div className="pt-2 px-2 border-t border-slate-100">
            <button
              onClick={() => {
                setIsOpen(false);
                onAddNewFarm();
              }}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center font-bold text-xs shadow-xs transition cursor-pointer"
            >
              {t.addNewFarmBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

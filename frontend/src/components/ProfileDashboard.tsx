import React, { useState } from 'react';
import { toLocalizedDigits, Language } from '../translations';
import { IconSprout, IconCheckCircle, IconShieldAlert } from './Icons';

interface ProfileDashboardProps {
  user: any;
  farms: any[];
  activeFarm: any;
  onSelectFarm: (farm: any) => void;
  onOpenAddFarmModal: () => void;
  onProfileUpdated: (updatedUser: any) => void;
  onDeleteFarm: (farmId: number) => void;
  t: Record<string, string>;
  lang: Language;
}

export const ProfileDashboard: React.FC<ProfileDashboardProps> = ({
  user,
  farms,
  activeFarm,
  onSelectFarm,
  onOpenAddFarmModal,
  onProfileUpdated,
  onDeleteFarm,
  t,
  lang,
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState(user?.name || 'Ramesh Kumar');
  const [phone, setPhone] = useState(user?.phone || '9876543210');
  const [stateDistrict, setStateDistrict] = useState(user?.state_district || 'Kolar, Karnataka');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Total acreage calculation
  const totalAcres = farms.reduce((acc, f) => acc + (f.area_acres || 1.2), 0);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const payload = {
        id: user?.id || 1,
        phone,
        name,
        state_district: stateDistrict,
        language_pref: lang,
        latitude: user?.latitude || 13.1339,
        longitude: user?.longitude || 78.1340,
      };

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const updated = await res.json();
      onProfileUpdated(updated);
      setIsEditingProfile(false);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Farmer Identification & Account Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-3xl shadow-md shadow-emerald-600/30">
              👨‍🌾
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900">{user?.name || t.farmerGreeting}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ICAR-IIHR KVK Farmer
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                📞 {toLocalizedDigits(user?.phone || '9876543210', lang)} • 📍 {user?.state_district || t.farmerLocation}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                GPS Anchor: {toLocalizedDigits(user?.latitude?.toFixed(4) || 13.1340, lang)}°N, {toLocalizedDigits(user?.longitude?.toFixed(4) || 78.1340, lang)}°E
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition cursor-pointer"
          >
            {isEditingProfile ? t.cancelBtn : '✏️ ' + t.editProfileBtn}
          </button>
        </div>

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
            {successMsg}
          </div>
        )}

        {/* Edit Profile Form */}
        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} className="mt-5 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs animate-fadeIn">
            <h3 className="font-bold text-slate-800">{t.editProfileBtn}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-600 block mb-1 font-medium">{t.nameLabel}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1 font-medium">{t.phoneLabel}</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1 font-medium">{t.stateDistrictLabel}</label>
                <input
                  type="text"
                  value={stateDistrict}
                  onChange={(e) => setStateDistrict(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer"
              >
                {saving ? 'Saving...' : t.saveProfileBtn}
              </button>
            </div>
          </form>
        )}

        {/* Portfolio Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-medium text-slate-400 block">{t.totalLandHolding}</span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-2xl font-black text-slate-900">{toLocalizedDigits(totalAcres.toFixed(1), lang)}</span>
              <span className="text-xs font-bold text-slate-600">{t.areaLabel}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-medium text-slate-400 block">{t.registeredPlots}</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {toLocalizedDigits(farms.length, lang)} <span className="text-xs font-normal text-slate-500">Plots</span>
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-medium text-slate-400 block">Current Active Crop</span>
            <span className="text-sm font-bold text-emerald-800 mt-1 block truncate">
              {activeFarm?.tomato_variety || 'Arka Rakshak'}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-medium text-slate-400 block">Agronomic Standards</span>
            <span className="text-xs font-bold text-slate-700 mt-1 block">
              ICAR-IIHR Bengaluru
            </span>
          </div>
        </div>
      </div>

      {/* 2. Registered Farm Plots Management Section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {t.registeredPlots} ({toLocalizedDigits(farms.length, lang)})
            </h3>
            <p className="text-xs text-slate-500">
              Manage your agricultural field boundaries, tomato varieties, and soil settings
            </p>
          </div>

          <button
            onClick={onOpenAddFarmModal}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition cursor-pointer"
          >
            <span>+</span>
            <span>{t.addNewFarmBtn}</span>
          </button>
        </div>

        {/* Farm Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          {farms.map((farm) => {
            const isCurrent = farm.id === activeFarm?.id;
            const acres = farm.area_acres || 1.2;
            const guntas = Math.round((acres - Math.floor(acres)) * 40);

            return (
              <div
                key={farm.id}
                className={`rounded-3xl p-5 border transition-all ${
                  isCurrent
                    ? 'bg-emerald-50/50 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        {farm.field_name}
                      </h4>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 mt-0.5 block">
                      {farm.tomato_variety}
                    </span>
                  </div>

                  <span className="text-lg font-black text-slate-800">
                    {toLocalizedDigits(acres, lang)} {t.areaLabel}
                    <span className="text-[10px] text-slate-400 block font-normal text-right">
                      ({toLocalizedDigits(Math.floor(acres), lang)} Acre {toLocalizedDigits(guntas, lang)} {t.guntasLabel})
                    </span>
                  </span>
                </div>

                {/* Metadata Pills */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 my-3 bg-white p-3 rounded-2xl border border-slate-200/80">
                  <div>
                    <span className="text-slate-400 block text-[10px]">{t.irrigationTypeLabel}</span>
                    <strong className="text-slate-800">{farm.irrigation_type || 'Drip Lateral System'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">{t.soilTypeLabel}</span>
                    <strong className="text-slate-800">{farm.soil_type || 'Red Sandy Loam'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">{t.plantingDateLabel}</span>
                    <span className="text-slate-800">{farm.planting_date || '15 Oct 2026'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">{t.gpsCoordsLabel}</span>
                    <span className="text-slate-800 font-mono text-[10px]">
                      {toLocalizedDigits(farm.center_lat?.toFixed(4) || 13.1340, lang)}°N, {toLocalizedDigits(farm.center_lng?.toFixed(4) || 78.1340, lang)}°E
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  {!isCurrent ? (
                    <button
                      onClick={() => onSelectFarm(farm)}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs border border-slate-200 transition cursor-pointer"
                    >
                      {t.setActiveFarmBtn}
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                      <IconCheckCircle className="w-4 h-4" />
                      <span>{t.currentActiveFarm}</span>
                    </span>
                  )}

                  {farms.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${farm.field_name}?`)) {
                          onDeleteFarm(farm.id);
                        }
                      }}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer px-2 py-1"
                    >
                      {t.deleteFarmBtn}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

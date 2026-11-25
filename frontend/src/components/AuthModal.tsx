import React, { useState } from 'react';
import { toLocalizedDigits, Language } from '../translations';
import { IconSprout } from './Icons';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any, activeFarm: any) => void;
  t: Record<string, string>;
  lang: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  t,
  lang,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [phone, setPhone] = useState('9876543210');
  const [name, setName] = useState('Ramesh Kumar (ರಮೇಶ್ ಕುಮಾರ್)');
  const [stateDistrict, setStateDistrict] = useState('Kolar, Karnataka');
  const [lat, setLat] = useState('13.1339');
  const [lng, setLng] = useState('78.1340');
  const [fieldName, setFieldName] = useState('Kolar North Tomato Plot #1');
  const [areaAcres, setAreaAcres] = useState('1.2');
  const [variety, setVariety] = useState('Arka Rakshak (ICAR-IIHR Hybrid)');
  const [irrigation, setIrrigation] = useState('Drip Lateral System');
  const [soil, setSoil] = useState('Red Sandy Loam');
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAutoDetectGPS = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('Geolocation not supported by this browser.');
      return;
    }
    setGpsStatus('Locating GPS coordinates via satellite/network...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const cLat = pos.coords.latitude.toFixed(4);
        const cLng = pos.coords.longitude.toFixed(4);
        setLat(cLat);
        setLng(cLng);
        setGpsStatus(t.gpsDetectedMsg + ` (${toLocalizedDigits(cLat, lang)}°N, ${toLocalizedDigits(cLng, lang)}°E)`);
      },
      (err) => {
        console.warn('GPS error:', err);
        setGpsStatus('Defaulting to ICAR-IIHR Kolar Grid (13.1340°N, 78.1340°E)');
        setLat('13.1340');
        setLng('78.1340');
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      if (isRegisterMode) {
        const payload = {
          phone,
          name,
          state_district: stateDistrict,
          language_pref: lang,
          latitude: parseFloat(lat) || 13.1339,
          longitude: parseFloat(lng) || 78.1340,
          field_name: fieldName,
          area_acres: parseFloat(areaAcres) || 1.2,
          tomato_variety: variety,
          irrigation_type: irrigation,
          soil_type: soil,
        };

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const user = await res.json();

        // Fetch user's registered farms
        const fRes = await fetch(`/api/fields?user_id=${user.id}`);
        const farms = await fRes.json();
        const activeFarm = farms[0] || null;

        onAuthSuccess(user, activeFarm);
        onClose();
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        });
        const user = await res.json();

        const fRes = await fetch(`/api/fields?user_id=${user.id}`);
        const farms = await fRes.json();
        const activeFarm = farms[0] || null;

        onAuthSuccess(user, activeFarm);
        onClose();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg('Failed to authenticate. Please check server connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200 relative animate-fadeIn my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-3 text-2xl font-bold shadow-md shadow-emerald-600/30">
            👨‍🌾
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {isRegisterMode ? t.registerTitle : t.loginTitle}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isRegisterMode
              ? 'Enter your farm land details, GPS coordinates, and tomato crop setup.'
              : 'Enter your registered mobile number to open your farm dashboard.'}
          </p>
        </div>

        {/* Toggle Mode */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => setIsRegisterMode(false)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              !isRegisterMode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            {t.loginBtn}
          </button>
          <button
            type="button"
            onClick={() => setIsRegisterMode(true)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              isRegisterMode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            {t.registerTitle}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              {t.phoneLabel}
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {isRegisterMode && (
            <>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {t.nameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {t.stateDistrictLabel}
                </label>
                <input
                  type="text"
                  value={stateDistrict}
                  onChange={(e) => setStateDistrict(e.target.value)}
                  placeholder="e.g. Kolar, Karnataka"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* GPS Detection Box */}
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-emerald-950">
                    {t.gpsCoordsLabel}
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoDetectGPS}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-xs transition cursor-pointer"
                  >
                    {t.autoDetectGpsBtn}
                  </button>
                </div>
                {gpsStatus && (
                  <p className="text-[11px] text-emerald-800 font-medium mb-2">
                    {gpsStatus}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">{t.latLabel}</label>
                    <input
                      type="text"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">{t.lngLabel}</label>
                    <input
                      type="text"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Farm land specs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {t.farmNameLabel}
                  </label>
                  <input
                    type="text"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {t.landAreaLabel}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={areaAcres}
                    onChange={(e) => setAreaAcres(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {t.varietySelectLabel}
                  </label>
                  <select
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 text-xs"
                  >
                    <option value="Arka Rakshak (ICAR-IIHR Hybrid)">Arka Rakshak (IIHR)</option>
                    <option value="Arka Vikas (High-Yield Hybrid)">Arka Vikas (IIHR)</option>
                    <option value="Abhinav (Syngenta Hybrid)">Abhinav (Commercial)</option>
                    <option value="Local Country Tomato (Desi)">Local Country Desi</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {t.irrigationSelectLabel}
                  </label>
                  <select
                    value={irrigation}
                    onChange={(e) => setIrrigation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 text-xs"
                  >
                    <option value="Drip Lateral System">Drip Lateral (Roots Only)</option>
                    <option value="Sprinkler & Foliar">Sprinkler & Foliar</option>
                    <option value="Furrow / Surface Basin">Furrow / Flood Surface</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {errorMsg && (
            <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition cursor-pointer mt-4"
          >
            {submitting
              ? 'Processing...'
              : isRegisterMode
              ? t.createAccountBtn
              : t.loginBtn}
          </button>
        </form>
      </div>
    </div>
  );
};

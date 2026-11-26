import React, { useState, useEffect } from 'react';
import { TRANSLATIONS, Language, toLocalizedDigits } from './translations';
import {
  IconGlobe,
  IconVolume2,
  IconSprout,
  IconCamera,
  IconShieldAlert,
  IconWind,
} from './components/Icons';
import { FieldMap } from './components/FieldMap';
import { RiskMeter } from './components/RiskMeter';
import { LeafScanner } from './components/LeafScanner';
import { ScanHistory } from './components/ScanHistory';
import { ParameterGraphs } from './components/ParameterGraphs';
import { CommunityRadar } from './components/CommunityRadar';
import { SatelliteCard } from './components/SatelliteCard';
import { GroundTruthCard } from './components/GroundTruthCard';
import { KisanChatbot } from './components/KisanChatbot';
import { FloatingChatbot } from './components/FloatingChatbot';
import { AuthModal } from './components/AuthModal';
import { FarmSwitcher } from './components/FarmSwitcher';
import { AddFarmModal } from './components/AddFarmModal';
import { ProfileDashboard } from './components/ProfileDashboard';
import { CoTrainingCard } from './components/CoTrainingCard';

type ActiveTab =
  | 'dashboard'
  | 'doctor'
  | 'history'
  | 'graphs'
  | 'farm'
  | 'weather'
  | 'satellite'
  | 'community'
  | 'chatbot'
  | 'groundtruth'
  | 'profile';

export default function App() {
  // 1. Language state with auto-detect from browser locale
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('agroshield_lang') as Language;
    if (saved && ['kn', 'mr', 'hi', 'en'].includes(saved)) return saved;

    const navLang = navigator.language.toLowerCase();
    if (navLang.includes('kn')) return 'kn';
    if (navLang.includes('mr')) return 'mr';
    if (navLang.includes('hi')) return 'hi';
    return 'kn'; // Default to Kannada (Kolar context)
  });

  const t = TRANSLATIONS[lang];

  // 2. Active Tab State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      localStorage.getItem('croply_pwa_installed') === 'true'
    );
  });
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isAppInstalled) {
        setShowInstallBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setShowInstallBanner(false);
      localStorage.setItem('croply_pwa_installed', 'true');
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isAppInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('To install Croply: tap your browser menu (⋮ or Share) and select "Add to Home screen" / "Install App".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsAppInstalled(true);
      setShowInstallBanner(false);
      localStorage.setItem('croply_pwa_installed', 'true');
    }
    setDeferredPrompt(null);
  };

  // Light Mode Enforced Permanently (Dark mode disabled per user preference)
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    if (document.body) document.body.classList.remove('dark');
    localStorage.removeItem('croply_theme');
    localStorage.removeItem('agroshield_theme');
    localStorage.removeItem('theme');
  }, []);

  // 3. User & Multi-Farm State
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('agroshield_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [farms, setFarms] = useState<any[]>([]);
  const [activeFarm, setActiveFarm] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddFarmModalOpen, setIsAddFarmModalOpen] = useState(false);

  // 4. Data states
  const [weatherData, setWeatherData] = useState<any>(null);
  const [satelliteData, setSatelliteData] = useState<any>(null);
  const [communityData, setCommunityData] = useState<any>(null);
  const [irrigationMode, setIrrigationMode] = useState('Drip');
  const [loading, setLoading] = useState(true);

  // 5. Plantix Clean UI States
  const [selectedCrop, setSelectedCrop] = useState<string>('Tomato');
  const [activeQuickTool, setActiveQuickTool] = useState<string | null>(null);

  // Persist language change
  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('agroshield_lang', newLang);
  };

  // Web Speech API Voice Text-to-Speech
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang =
      lang === 'kn' ? 'kn-IN' :
      lang === 'mr' ? 'mr-IN' :
      lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // Load farms and user profile on mount
  const fetchUserDataAndFarms = async () => {
    try {
      const uRes = await fetch('/api/user/profile?user_id=1');
      if (uRes.ok) {
        const uData = await uRes.json();
        setUser(uData);
        localStorage.setItem('agroshield_user', JSON.stringify(uData));
      }

      const fRes = await fetch('/api/fields');
      if (fRes.ok) {
        const fList = await fRes.json();
        setFarms(fList);
        if (fList.length > 0) {
          const savedFarmId = localStorage.getItem('agroshield_farm_id');
          const matched = fList.find((f: any) => f.id.toString() === savedFarmId);
          setActiveFarm(matched || fList[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load user and farms:', err);
    }
  };

  // Load weather, satellite, community for current active farm
  const loadFarmData = async (farmId: number, mode = irrigationMode) => {
    try {
      setLoading(true);
      const wRes = await fetch(`/api/weather/tomcast/${farmId}?irrigation_mode=${mode}`);
      const wJson = await wRes.json();
      setWeatherData(wJson);

      const sRes = await fetch(`/api/satellite/canopy/${farmId}?cloud_cover_pct=12`);
      const sJson = await sRes.json();
      setSatelliteData(sJson);

      const cRes = await fetch(`/api/community/network/${farmId}?wind_dir_deg=265&wind_speed_kmh=12`);
      const cJson = await cRes.json();
      setCommunityData(cJson);
    } catch (err) {
      console.error('Failed to load farm data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDataAndFarms();
  }, []);

  useEffect(() => {
    if (activeFarm?.id) {
      localStorage.setItem('agroshield_farm_id', activeFarm.id.toString());
      loadFarmData(activeFarm.id, irrigationMode);
    }
  }, [activeFarm]);

  // Real-time Day/Night & Meteorological Condition Dynamic Emoji Resolver
  const getWeatherEmoji = (desc?: string) => {
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour >= 19;
    const text = (desc || '').toLowerCase();

    if (text.includes('rain') || text.includes('drizzle')) {
      return isNight ? '🌧️' : '🌦️';
    }
    if (text.includes('thunder') || text.includes('storm')) {
      return '⛈️';
    }
    if (text.includes('fog') || text.includes('mist') || text.includes('haze')) {
      return isNight ? '🌫️' : '🌁';
    }
    if (text.includes('cloud') || text.includes('overcast')) {
      return isNight ? '☁️' : '⛅';
    }
    if (text.includes('clear') || text.includes('sunny')) {
      return isNight ? '🌙' : '☀️';
    }

    // Default based on real clock hour
    return isNight ? '🌙' : '☀️';
  };

  const handleIrrigationToggle = (mode: string) => {
    setIrrigationMode(mode);
    if (activeFarm?.id) {
      loadFarmData(activeFarm.id, mode);
    }
  };

  const handleSimulateCloud = async (cloudPct: number) => {
    if (!activeFarm?.id) return;
    try {
      const res = await fetch(`/api/satellite/canopy/${activeFarm.id}?cloud_cover_pct=${cloudPct}`);
      const data = await res.json();
      setSatelliteData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuthSuccess = (authenticatedUser: any, farm: any) => {
    setUser(authenticatedUser);
    localStorage.setItem('agroshield_user', JSON.stringify(authenticatedUser));
    if (farm) {
      setActiveFarm(farm);
      setFarms((prev) => {
        const exists = prev.some((f) => f.id === farm.id);
        return exists ? prev : [farm, ...prev];
      });
    }
  };

  const handleFarmAdded = (newFarm: any) => {
    setFarms((prev) => [newFarm, ...prev.filter((f) => f.id !== newFarm.id)]);
    setActiveFarm(newFarm);
    if (newFarm.id) {
      localStorage.setItem('agroshield_farm_id', newFarm.id.toString());
      loadFarmData(newFarm.id, irrigationMode);
    }
  };

  const handleBoundaryUpdate = async (newCoords: number[][]) => {
    if (!activeFarm?.id) return;
    try {
      let m2 = 0;
      if (newCoords.length >= 3) {
        let area = 0;
        const R = 6378137;
        const pts = newCoords.map((c) => [(c[1] * Math.PI) / 180, (c[0] * Math.PI) / 180]);
        for (let i = 0; i < pts.length; i++) {
          const j = (i + 1) % pts.length;
          area += (pts[j][0] - pts[i][0]) * (2 + Math.sin(pts[i][1]) + Math.sin(pts[j][1]));
        }
        m2 = Math.abs((area * R * R) / 2.0);
      }
      const newAcres = m2 > 0 ? parseFloat((m2 / 4046.86).toFixed(2)) : (activeFarm.area_acres || 1.2);
      const avgLat = newCoords.reduce((acc, curr) => acc + curr[0], 0) / newCoords.length;
      const avgLng = newCoords.reduce((acc, curr) => acc + curr[1], 0) / newCoords.length;

      const updatePayload = {
        boundary_geojson: newCoords,
        center_lat: avgLat,
        center_lng: avgLng,
        area_acres: newAcres,
      };

      const res = await fetch(`/api/fields/${activeFarm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (res.ok) {
        const updated = await res.json();
        setActiveFarm(updated);
        setFarms((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      }
    } catch (err) {
      console.error('Failed to update field boundary:', err);
    }
  };

  const handleDeleteFarm = async (farmId: number) => {
    try {
      await fetch(`/api/fields/${farmId}`, { method: 'DELETE' });
      setFarms((prev) => {
        const filtered = prev.filter((f) => f.id !== farmId);
        if (activeFarm?.id === farmId) {
          setActiveFarm(filtered[0] || null);
        }
        return filtered;
      });
    } catch (err) {
      console.error('Failed to delete farm:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-28 relative">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 py-2.5 shadow-xs">
        <div className="max-w-7xl mx-auto">
          {/* Main Header Row */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: Brand Logo & Title */}
            <div className="flex items-center space-x-2.5 min-w-0">
              <img src="/icon-192.png" alt="Croply" className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl object-cover shadow-xs border border-emerald-500/30 flex-shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-base sm:text-lg md:text-xl tracking-tight text-slate-900 truncate">
                    Croply
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 hidden md:inline">
                    {t.verifiedStandard}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden md:block truncate">
                  {t.tagline}
                </p>
              </div>
            </div>

            {/* Right Controls: Farm Switcher (Desktop), Audio, Language, Profile */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
              {/* Multi-Farm Dropdown Selector on Tablet & Desktop */}
              {farms.length > 0 && (
                <div className="hidden sm:block">
                  <FarmSwitcher
                    farms={farms}
                    activeFarm={activeFarm}
                    onSelectFarm={(farm) => setActiveFarm(farm)}
                    onAddNewFarm={() => setIsAddFarmModalOpen(true)}
                    t={t}
                    lang={lang}
                  />
                </div>
              )}

              {/* Read-Aloud Voice Button */}
              <button
                onClick={() => speakText(`${t.appTitle}. ${user?.name || t.farmerGreeting}. ${activeFarm?.field_name || ''}. ${weatherData?.biological_explanation || ''}`)}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold transition border border-slate-200 cursor-pointer flex items-center space-x-1"
                title={t.readAloud}
              >
                <IconVolume2 className="w-4 h-4 text-emerald-600" />
                <span className="hidden lg:inline">{t.readAloud}</span>
              </button>

              {/* 4-Language Pill Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-slate-200">
                {(['kn', 'mr', 'hi', 'en'] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => handleLangChange(l)}
                    className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition cursor-pointer ${
                      lang === l
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {l === 'kn' ? 'ಕ' : l === 'mr' ? 'मर' : l === 'hi' ? 'हि' : 'EN'}
                  </button>
                ))}
              </div>

              {/* Install PWA App Button (Desktop) */}
              {!isAppInstalled && (
                <button
                  onClick={handleInstallClick}
                  className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-xs transition cursor-pointer"
                  title="Install Croply App"
                >
                  <span>📲</span>
                  <span>Install</span>
                </button>
              )}

              {/* Profile / Account Dashboard Button */}
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                  activeTab === 'profile'
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}
              >
                <span>👤</span>
                <span className="hidden sm:inline">{user ? user.name.split(' ')[0] : t.loginBtn}</span>
              </button>
            </div>
          </div>

          {/* Dedicated Clean Sub-Row on Mobile for Farm Switcher & Install */}
          <div className="sm:hidden mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            {farms.length > 0 && (
              <div className="flex-1 min-w-0">
                <FarmSwitcher
                  farms={farms}
                  activeFarm={activeFarm}
                  onSelectFarm={(farm) => setActiveFarm(farm)}
                  onAddNewFarm={() => setIsAddFarmModalOpen(true)}
                  t={t}
                  lang={lang}
                />
              </div>
            )}
            {!isAppInstalled && (
              <button
                onClick={handleInstallClick}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs flex items-center space-x-1 flex-shrink-0 cursor-pointer"
              >
                <span>📲</span>
                <span>Install</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-5">
        {/* Mobile Smart PWA Install Callout Banner (Disappears after install) */}
        {!isAppInstalled && showInstallBanner && (
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl p-3.5 mb-5 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-3">
              <img src="/icon-192.png" alt="Croply" className="w-10 h-10 rounded-xl object-cover shadow-sm border border-emerald-400/40 flex-shrink-0" />
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold leading-tight">Install Croply App</h4>
                <p className="text-[11px] text-emerald-100 mt-0.5">Instant 1-tap crop scanning, offline support & full-screen view</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleInstallClick}
                className="px-3.5 py-1.5 bg-white text-emerald-900 rounded-xl text-xs font-black shadow-xs hover:bg-emerald-50 transition cursor-pointer"
              >
                Install
              </button>
              <button
                onClick={() => setShowInstallBanner(false)}
                className="w-7 h-7 rounded-lg text-emerald-200 hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        {/* Farmer Profile & Greeting Banner */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div
            onClick={() => setActiveTab('profile')}
            className="flex items-start sm:items-center space-x-3 cursor-pointer group"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs group-hover:scale-105 transition flex-shrink-0">
              👨‍🌾
            </div>
            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-1.5">
                <h1 className="text-base md:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition truncate">
                  {user?.name || t.farmerGreeting}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium whitespace-nowrap">
                  📍 {activeFarm?.field_name ? activeFarm.field_name.split('(')[0].trim() : (user?.state_district || t.farmerLocation)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                <strong>{activeFarm?.field_name ? activeFarm.field_name.split('(')[0].trim() : t.farmNameLabel}</strong> • {t.varietyLabel}: {activeFarm?.tomato_variety || 'Arka Rakshak'} • {t.areaLabel}: {toLocalizedDigits(activeFarm?.area_acres || 1.2, lang)} Acres
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:space-x-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <button
              onClick={() => setIsAddFarmModalOpen(true)}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition cursor-pointer"
            >
              <span>🌱</span>
              <span className="truncate">{t.addNewFarmBtn}</span>
            </button>

            <button
              onClick={() => setActiveTab('farm')}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition cursor-pointer"
            >
              <IconSprout className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="truncate">{t.editBoundaryBtn}</span>
            </button>
          </div>
        </div>

        {/* Clean Farmer Navigation Menu Bar with edge-to-edge scroll */}
        <nav className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs mb-6 flex items-center overflow-x-auto space-x-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>🏠</span>
            <span>{t.navDashboard}</span>
          </button>

          <button
            onClick={() => setActiveTab('doctor')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'doctor'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <IconCamera className="w-4 h-4" />
            <span>{t.navDoctor}</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>📜</span>
            <span>{t.navHistory}</span>
          </button>

          <button
            onClick={() => setActiveTab('graphs')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'graphs'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>📈</span>
            <span>{t.navGraphs}</span>
          </button>

          <button
            onClick={() => setActiveTab('farm')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'farm'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <IconSprout className="w-4 h-4" />
            <span>{t.navFarm}</span>
          </button>

          <button
            onClick={() => setActiveTab('weather')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'weather'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <IconShieldAlert className="w-4 h-4" />
            <span>{t.navWeather}</span>
          </button>

          <button
            onClick={() => setActiveTab('satellite')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'satellite'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>🛰️</span>
            <span>{t.navSatellite}</span>
          </button>

          <button
            onClick={() => setActiveTab('community')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'community'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <IconWind className="w-4 h-4" />
            <span>{t.navCommunity}</span>
          </button>

          <button
            onClick={() => setActiveTab('groundtruth')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'groundtruth'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>📋</span>
            <span>{t.navGroundTruth}</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>👤</span>
            <span>{t.navProfile}</span>
          </button>
        </nav>

        {/* TAB 1: MAIN DASHBOARD (PLANTIX FARMER-FRIENDLY CLEAN STYLE) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* 1. Dedicated Tomato Crop Indicator (Only One Tomato) */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 md:p-3 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs md:text-sm font-extrabold bg-white text-emerald-900 shadow-xs border border-emerald-300 ring-2 ring-emerald-500/20">
                  <span className="text-xl">🍅</span>
                  <span>{lang === 'kn' ? 'ಟೊಮೇಟೊ' : lang === 'mr' ? 'टोमॅटो' : lang === 'hi' ? 'टमाटर' : 'Tomato'}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full ml-1">
                    ● {lang === 'kn' ? 'ಸಕ್ರಿಯ ಬೆಳೆ' : lang === 'mr' ? 'सक्रिय पीक' : lang === 'hi' ? 'सक्रिय फसल' : 'Active Crop'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <span className="text-xs text-slate-700 font-bold block">
                    {activeFarm?.tomato_variety || 'Arka Rakshak (ICAR-IIHR Hybrid)'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Solanum lycopersicum • {toLocalizedDigits(activeFarm?.area_acres || 1.2, lang)} Acres
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-semibold block">
                  {lang === 'kn' ? 'ಮೀಸಲಾದ ಬೆಳೆ ರಕ್ಷಣೆ' : lang === 'mr' ? 'समर्पित पीक संरक्षण' : lang === 'hi' ? 'समर्पित फसल सुरक्षा' : 'Dedicated AI Protection'}
                </span>
                <span className="text-xs font-bold text-emerald-700">ICAR-IIHR Verified</span>
              </div>
            </div>

            {/* 2. Quick Tools Trio: Fertilizer Calculator, Pests & Diseases, Cultivation Tips */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setActiveQuickTool('fertilizer')}
                className="bg-white hover:bg-emerald-50/40 p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition text-left flex flex-col justify-between group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl mb-2 group-hover:scale-105 transition">
                  🧪
                </div>
                <div>
                  <span className="text-xs md:text-sm font-bold text-slate-800 block">
                    {t.fertilizerCalc}
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
                    {toLocalizedDigits(activeFarm?.area_acres || 1.2, lang)} Acres Plot Dose
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveQuickTool('pests')}
                className="bg-white hover:bg-emerald-50/40 p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition text-left flex flex-col justify-between group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl mb-2 group-hover:scale-105 transition">
                  🐛
                </div>
                <div>
                  <span className="text-xs md:text-sm font-bold text-slate-800 block">
                    {t.pestsDiseases}
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
                    Blight, Wilt & Spot Guide
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveQuickTool('tips')}
                className="bg-white hover:bg-emerald-50/40 p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition text-left flex flex-col justify-between group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-xl mb-2 group-hover:scale-105 transition">
                  🌾
                </div>
                <div>
                  <span className="text-xs md:text-sm font-bold text-slate-800 block">
                    {t.cultivationTips}
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
                    Irrigation & Pruning Advice
                  </span>
                </div>
              </button>
            </div>

            {/* 3. Heal Your Crop (Visual 3-Step Plantix Workflow + Single Prominent Button) */}
            <div className="bg-white rounded-3xl p-6 md:p-7 border border-slate-200/90 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base md:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span>🌿</span>
                  <span>{t.heroScanTitle}</span>
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                  AI Crop Doctor
                </span>
              </div>

              {/* 3 Step Visual Progression */}
              <div className="grid grid-cols-3 gap-2 md:gap-4 items-center mb-6">
                {/* Step 1 */}
                <div className="bg-slate-50 rounded-2xl p-3 md:p-4 text-center border border-slate-100 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-2xs mb-2">
                    📸
                  </div>
                  <span className="text-[11px] md:text-xs font-bold text-slate-800 block">
                    {t.step1_takePic}
                  </span>
                  <span className="text-[9px] md:text-[10px] text-slate-400 mt-0.5 hidden sm:block">
                    Leaf bottom
                  </span>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-50 rounded-2xl p-3 md:p-4 text-center border border-slate-100 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-2xs mb-2">
                    📱
                  </div>
                  <span className="text-[11px] md:text-xs font-bold text-slate-800 block">
                    {t.step2_diagnosis}
                  </span>
                  <span className="text-[9px] md:text-[10px] text-slate-400 mt-0.5 hidden sm:block">
                    Instant AI check
                  </span>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-50 rounded-2xl p-3 md:p-4 text-center border border-slate-100 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-2xs mb-2">
                    🧴
                  </div>
                  <span className="text-[11px] md:text-xs font-bold text-slate-800 block">
                    {t.step3_medicine}
                  </span>
                  <span className="text-[9px] md:text-[10px] text-slate-400 mt-0.5 hidden sm:block">
                    ICAR Dosage
                  </span>
                </div>
              </div>

              {/* Single High-Contrast Action Button (Blue like Plantix) */}
              <button
                onClick={() => setActiveTab('doctor')}
                className="w-full py-3.5 md:py-4 rounded-2xl bg-[#0b66e4] hover:bg-blue-700 active:scale-[0.99] text-white font-black text-sm md:text-base shadow-md shadow-blue-600/25 transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <IconCamera className="w-5 h-5 text-white" />
                <span>{t.takePictureBtn}</span>
              </button>
            </div>

            {/* 4. Weather Summary Card (Plantix Style) */}
            <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-xl">{getWeatherEmoji(weatherData?.weather_condition_desc)}</span>
                  <span>{t.navWeather}</span>
                </h3>
                <button
                  onClick={() => setActiveTab('weather')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  {t.viewResultBtn} →
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl animate-bounce-short">
                    {getWeatherEmoji(weatherData?.weather_condition_desc)}
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-semibold block">
                      Today, {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {new Date().getHours() < 6 || new Date().getHours() >= 19 ? 'Night' : 'Day'}
                    </span>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl md:text-3xl font-black text-slate-900">
                        {toLocalizedDigits(weatherData?.current_temp_c != null ? weatherData.current_temp_c.toFixed(1) : '24.0', lang)} °C
                      </span>
                      <span className="text-xs font-bold text-slate-600">
                        {weatherData?.weather_condition_desc || 'Clear ☀️'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-2xl flex items-center space-x-2.5">
                  <span className="text-xl">✅</span>
                  <div>
                    <span className="text-xs font-extrabold text-emerald-900 block">
                      {t.sprayConditionGood}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">
                      Wind: 8 km/h • Humidity: {toLocalizedDigits(weatherData?.current_humidity_pct || 65, lang)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Farm Profile & Real Interactive Satellite Map */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200/80 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-slate-900">
                    {activeFarm?.field_name ? activeFarm.field_name.split('(')[0].trim() : t.farmProfileTitle}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t.farmProfileSubtitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    onClick={() => setIsAddFarmModalOpen(true)}
                    className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 cursor-pointer transition whitespace-nowrap"
                  >
                    {t.addNewFarmBtn?.startsWith('+') ? t.addNewFarmBtn : `+ ${t.addNewFarmBtn}`}
                  </button>
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 whitespace-nowrap">
                    {toLocalizedDigits(activeFarm?.area_acres || 1.2, lang)} Acres • {activeFarm?.tomato_variety || 'Arka Rakshak'}
                  </span>
                </div>
              </div>

              {/* Real Satellite Map (Esri World Imagery) with Boundary */}
              <div className="mt-5">
                <FieldMap
                  key={`dash-map-${activeFarm?.id || 1}`}
                  farmId={activeFarm?.id}
                  centerLat={activeFarm?.center_lat || 13.1582}
                  centerLng={activeFarm?.center_lng || 78.1622}
                  fieldName={activeFarm?.field_name || 'Tomato Plot'}
                  boundaryGeojson={activeFarm?.boundary_geojson}
                  areaAcres={activeFarm?.area_acres}
                  tomatoVariety={activeFarm?.tomato_variety}
                  irrigationType={activeFarm?.irrigation_type}
                  outbreaks={communityData?.reports || []}
                  onBoundaryUpdate={handleBoundaryUpdate}
                  t={t}
                />
              </div>
            </div>

            {/* Grid of Key Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weather & Tom-Cast Risk Card Summary */}
              {weatherData && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-2xl ${
                          weatherData.risk_tier === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          <IconShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {t.weatherRiskTitle}
                          </h4>
                          <span className="text-xs font-semibold text-slate-500">
                            {weatherData.risk_tier === 'HIGH' ? t.riskHigh : weatherData.risk_tier === 'MODERATE' ? t.riskModerate : t.riskLow}
                          </span>
                        </div>
                      </div>

                      <span className="text-2xl font-black text-slate-800">
                        {toLocalizedDigits(weatherData.cumulative_5day_dsv, lang)} <span className="text-xs font-medium text-slate-400">DSV</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {weatherData.biological_explanation}
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setActiveTab('weather')}
                      className="flex-1 py-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-bold border border-slate-200 transition text-center cursor-pointer"
                    >
                      {t.navWeather} →
                    </button>
                    <button
                      onClick={() => setActiveTab('graphs')}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition text-center cursor-pointer"
                    >
                      {t.navGraphs} →
                    </button>
                  </div>
                </div>
              )}

              {/* Community Disease Network Summary */}
              {communityData && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
                          <IconWind className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {t.communityTitle}
                          </h4>
                          <span className="text-xs font-semibold text-amber-800">
                            {toLocalizedDigits(communityData.total_active_reports_within_5km, lang)} {t.verifiedSightingsLabel}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        {toLocalizedDigits(communityData.local_wind_speed_kmh, lang)} km/h (W)
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {communityData.advisory}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('community')}
                    className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-bold border border-slate-200 transition text-center cursor-pointer"
                  >
                    {t.navCommunity} →
                  </button>
                </div>
              )}
            </div>

            {/* Quick 7-Day Scan History Preview on Dashboard */}
            {activeFarm?.id && (
              <ScanHistory
                fieldId={activeFarm.id}
                t={t}
                lang={lang}
                onSpeak={speakText}
                onNavigateToScan={() => setActiveTab('doctor')}
              />
            )}
          </div>
        )}

        {/* TAB 2: CROP DOCTOR & LIVE SCANNER */}
        {activeTab === 'doctor' && (
          <div className="space-y-6">
            <LeafScanner fieldId={activeFarm?.id || 1} onSpeak={speakText} language={lang} t={t} />
          </div>
        )}

        {/* TAB 3: 7-DAY SCAN HISTORY */}
        {activeTab === 'history' && activeFarm?.id && (
          <div className="space-y-6">
            <ScanHistory
              fieldId={activeFarm.id}
              t={t}
              lang={lang}
              onSpeak={speakText}
              onNavigateToScan={() => setActiveTab('doctor')}
            />
          </div>
        )}

        {/* TAB 4: 7-DAY PARAMETER GRAPHS */}
        {activeTab === 'graphs' && activeFarm?.id && (
          <div className="space-y-6">
            <ParameterGraphs
              fieldId={activeFarm.id}
              t={t}
              lang={lang}
              onSpeak={speakText}
            />
          </div>
        )}

        {/* TAB 5: MY FARM & BOUNDARY */}
        {activeTab === 'farm' && (
          <div className="space-y-6">
            {/* Farm Details Card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                    👨‍🌾
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{activeFarm?.field_name}</h2>
                    <p className="text-xs text-slate-500">
                      {t.farmerNameLabel}: <strong className="text-slate-700">{user?.name || t.farmerGreeting}</strong> • {t.locationLabel}: {user?.state_district || t.farmerLocation}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <button
                    onClick={() => setIsAddFarmModalOpen(true)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap"
                  >
                    {t.addNewFarmBtn?.startsWith('+') ? t.addNewFarmBtn : `+ ${t.addNewFarmBtn}`}
                  </button>
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 font-bold rounded-xl border border-emerald-200 whitespace-nowrap">
                    {t.areaLabel}: {toLocalizedDigits(activeFarm?.area_acres || 1.2, lang)} Acres
                  </span>
                </div>
              </div>

              {/* Farm Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <span className="text-[11px] text-slate-400 block font-medium">{t.plantingDateLabel}</span>
                  <span className="text-sm font-bold text-slate-800">{activeFarm?.planting_date || '15 Oct 2026'}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <span className="text-[11px] text-slate-400 block font-medium">{t.irrigationTypeLabel}</span>
                  <span className="text-sm font-bold text-slate-800">{activeFarm?.irrigation_type || 'Drip Lateral System'}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <span className="text-[11px] text-slate-400 block font-medium">{t.soilTypeLabel}</span>
                  <span className="text-sm font-bold text-slate-800">{activeFarm?.soil_type || 'Red Sandy Loam'}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <span className="text-[11px] text-slate-400 block font-medium">{t.gpsCoordsLabel}</span>
                  <span className="text-sm font-bold text-slate-800 font-mono">
                    {toLocalizedDigits(activeFarm?.center_lat?.toFixed(4) || 13.1340, lang)}°N, {toLocalizedDigits(activeFarm?.center_lng?.toFixed(4) || 78.1340, lang)}°E
                  </span>
                </div>
              </div>

              {/* Actual Satellite Map (Esri World Imagery) with Boundary Adjuster */}
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{t.farmProfileTitle}</span>
                  <span>{t.farmProfileSubtitle}</span>
                </div>
                <FieldMap
                  key={`profile-map-${activeFarm?.id || 1}`}
                  farmId={activeFarm?.id}
                  centerLat={activeFarm?.center_lat || 13.1582}
                  centerLng={activeFarm?.center_lng || 78.1622}
                  fieldName={activeFarm?.field_name || 'Tomato Plot'}
                  boundaryGeojson={activeFarm?.boundary_geojson}
                  areaAcres={activeFarm?.area_acres}
                  tomatoVariety={activeFarm?.tomato_variety}
                  irrigationType={activeFarm?.irrigation_type}
                  outbreaks={communityData?.reports || []}
                  onBoundaryUpdate={handleBoundaryUpdate}
                  t={t}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: WEATHER RISK (TOM-CAST MODEL) */}
        {activeTab === 'weather' && weatherData && (
          <div className="space-y-6">
            <RiskMeter
              riskTier={weatherData.risk_tier}
              cumDsv={weatherData.cumulative_5day_dsv}
              todayDsv={weatherData.today_dsv}
              tempC={weatherData.current_temp_c}
              humidityPct={weatherData.current_humidity_pct}
              dpDepressionC={weatherData.dew_point_depression_c}
              wetHours={weatherData.hourly_continuous_wet_hours}
              bioExplanation={weatherData.biological_explanation}
              actionSummary={weatherData.recommended_action_summary}
              dataSource={weatherData.data_source}
              forecastTimestamp={weatherData.forecast_timestamp}
              irrigationMode={irrigationMode}
              t={t}
              onToggleIrrigation={handleIrrigationToggle}
              onSpeak={speakText}
            />
          </div>
        )}

        {/* TAB 7: SATELLITE CANOPY VIGOR */}
        {activeTab === 'satellite' && (
          <div className="space-y-6">
            <SatelliteCard
              satelliteData={satelliteData}
              activeFarm={activeFarm}
              t={t}
            />
          </div>
        )}

        {/* TAB 8: COMMUNITY DISEASE NETWORK */}
        {activeTab === 'community' && communityData && (
          <div className="space-y-6">
            <CommunityRadar
              totalReports={communityData.total_active_reports_within_5km}
              upwindHighRisk={communityData.upwind_high_risk_reports}
              proximityLevel={communityData.proximity_risk_level}
              windSpeedKmh={communityData.local_wind_speed_kmh}
              windDirectionDeg={communityData.local_wind_direction_deg}
              advisoryText={communityData.advisory}
              t={t}
              onSpeak={speakText}
            />
          </div>
        )}

        {/* TAB 9: GROUND-TRUTH EMPIRICAL LOGS & CO-TRAINING */}
        {activeTab === 'groundtruth' && activeFarm?.id && (
          <div className="space-y-6">
            <CoTrainingCard t={t} lang={lang} />
            <GroundTruthCard
              fieldId={activeFarm.id}
              currentRiskTier={weatherData?.risk_tier || 'HIGH'}
              currentCumDsv={weatherData?.cumulative_5day_dsv || 16}
              t={t}
            />
          </div>
        )}

        {/* TAB 10: PROFILE & FARM PORTFOLIO DASHBOARD */}
        {activeTab === 'profile' && (
          <ProfileDashboard
            user={user}
            farms={farms}
            activeFarm={activeFarm}
            onSelectFarm={(farm) => setActiveFarm(farm)}
            onOpenAddFarmModal={() => setIsAddFarmModalOpen(true)}
            onProfileUpdated={(updatedUser) => {
              setUser(updatedUser);
              localStorage.setItem('agroshield_user', JSON.stringify(updatedUser));
            }}
            onDeleteFarm={handleDeleteFarm}
            t={t}
            lang={lang}
          />
        )}
      </div>

      {/* Persistent Floating Kisan AI Chatbot Widget (Present on EVERY page/tab!) */}
      <FloatingChatbot language={lang} t={t} onSpeak={speakText} />

      {/* Auth / Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        t={t}
        lang={lang}
      />

      {/* Dedicated Add Farm & Satellite Area Calculator Modal */}
      <AddFarmModal
        isOpen={isAddFarmModalOpen}
        onClose={() => setIsAddFarmModalOpen(false)}
        onFarmAdded={handleFarmAdded}
        userId={user?.id || 1}
        t={t}
        lang={lang}
      />

      {/* QUICK TOOL 1: FERTILIZER CALCULATOR MODAL */}
      {activeQuickTool === 'fertilizer' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">🧪</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{t.fertilizerCalc}</h3>
                  <p className="text-xs text-slate-500">{activeFarm?.field_name || 'Tomato Plot'} • {toLocalizedDigits(activeFarm?.area_acres || 1.2, lang)} Acres</p>
                </div>
              </div>
              <button
                onClick={() => setActiveQuickTool(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl">
                <span className="font-extrabold text-emerald-900 block mb-1">🌱 Basal Dose (At Sowing / Transplanting):</span>
                <ul className="space-y-1 text-emerald-800 list-disc list-inside">
                  <li><strong>DAP:</strong> {Math.round((activeFarm?.area_acres || 1.2) * 35)} kg</li>
                  <li><strong>MOP (Potash):</strong> {Math.round((activeFarm?.area_acres || 1.2) * 30)} kg</li>
                  <li><strong>Neem Cake:</strong> {Math.round((activeFarm?.area_acres || 1.2) * 50)} kg</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl">
                <span className="font-extrabold text-blue-900 block mb-1">💧 Top Dressing & Fertigation:</span>
                <ul className="space-y-1 text-blue-800 list-disc list-inside">
                  <li><strong>Urea (30 DAT):</strong> {Math.round((activeFarm?.area_acres || 1.2) * 25)} kg</li>
                  <li><strong>Urea (50 DAT):</strong> {Math.round((activeFarm?.area_acres || 1.2) * 30)} kg</li>
                  <li><strong>19:19:19 (Water Soluble):</strong> 5 kg via drip weekly</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl">
                <span className="font-extrabold text-amber-900 block mb-1">🍃 Micronutrient Foliar Spray:</span>
                <p className="text-amber-800">Spray Zinc (0.5%) + Boron (0.2%) at flower initiation to prevent blossom-end rot.</p>
              </div>
            </div>

            <button
              onClick={() => setActiveQuickTool(null)}
              className="w-full mt-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              OK, Got It
            </button>
          </div>
        </div>
      )}

      {/* QUICK TOOL 2: PESTS & DISEASES GUIDE MODAL */}
      {activeQuickTool === 'pests' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">🐛</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{t.pestsDiseases}</h3>
                  <p className="text-xs text-slate-500">Tomato Crop Field Guide (CIBRC Standard)</p>
                </div>
              </div>
              <button
                onClick={() => setActiveQuickTool(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/60">
                <span className="font-bold text-rose-950 block text-sm">🍂 Early Blight (Alternaria solani)</span>
                <p className="text-slate-600 mt-1">Concentric brown target rings on lower leaves. Spreads during warm wet spells.</p>
                <div className="mt-2 bg-white/80 p-2 rounded-xl text-rose-900 font-semibold">
                  💊 Spray: Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/L (15 ml/pump)
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-900 block text-sm">💧 Late Blight (Phytophthora infestans)</span>
                <p className="text-slate-600 mt-1">Water-soaked dark lesions with fuzzy white spore growth on leaf margins.</p>
                <div className="mt-2 bg-white p-2 rounded-xl text-slate-800 font-semibold border border-slate-200">
                  💊 Spray: Cymoxanil 8% + Mancozeb 64% WP @ 2.5 g/L
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/60">
                <span className="font-bold text-amber-950 block text-sm">🪰 Whitefly & Leaf Curl Virus</span>
                <p className="text-slate-600 mt-1">Upward curling, puckering, and severe stunting transmitted by whiteflies.</p>
                <div className="mt-2 bg-white/80 p-2 rounded-xl text-amber-900 font-semibold">
                  💊 Spray: Acetamiprid 20% SP @ 0.5 g/L or Yellow Sticky Traps (10/acre)
                </div>
              </div>
            </div>

            <div className="flex space-x-2 mt-5">
              <button
                onClick={() => {
                  setActiveQuickTool(null);
                  setActiveTab('doctor');
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center space-x-1"
              >
                <IconCamera className="w-4 h-4" />
                <span>Open AI Scanner</span>
              </button>
              <button
                onClick={() => setActiveQuickTool(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK TOOL 3: CULTIVATION TIPS MODAL */}
      {activeQuickTool === 'tips' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">🌾</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{t.cultivationTips}</h3>
                  <p className="text-xs text-slate-500">ICAR-IIHR Best Agricultural Practices</p>
                </div>
              </div>
              <button
                onClick={() => setActiveQuickTool(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-start space-x-3">
                <span className="text-xl">💧</span>
                <div>
                  <strong className="font-bold text-emerald-950 block">Drip Irrigation Management</strong>
                  <p className="text-emerald-800 mt-0.5">Irrigate early morning (6:00 AM - 8:00 AM) for 45 minutes every 2 days. Avoid evening flood irrigation to prevent overnight leaf wetness.</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-start space-x-3">
                <span className="text-xl">🪵</span>
                <div>
                  <strong className="font-bold text-amber-950 block">Staking & Trellising</strong>
                  <p className="text-amber-800 mt-0.5">Tie plants to bamboo stakes at 30 days. Keeping vines off the soil reduces early blight spore infection by 75%.</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl flex items-start space-x-3">
                <span className="text-xl">✂️</span>
                <div>
                  <strong className="font-bold text-blue-950 block">Pruning Lower Leaves</strong>
                  <p className="text-blue-800 mt-0.5">Prune bottom leaves touching the soil up to 15 cm height. This improves airflow and stops soil-splash fungal spores.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveQuickTool(null)}
              className="w-full mt-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              OK, Understood
            </button>
          </div>
        </div>
      )}

      {/* MOBILE FIRST APP BOTTOM NAVIGATION BAR (PLANTIX NATIVE STYLE) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-3 z-40 shadow-lg flex items-center justify-around">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition cursor-pointer ${
            activeTab === 'dashboard' ? 'text-emerald-600 font-extrabold' : 'text-slate-400 font-medium'
          }`}
        >
          <span className="text-xl">🏠</span>
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('graphs')}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition cursor-pointer ${
            activeTab === 'graphs' ? 'text-emerald-600 font-extrabold' : 'text-slate-400 font-medium'
          }`}
        >
          <span className="text-xl">📈</span>
          <span className="text-[10px] mt-0.5">Trends</span>
        </button>

        {/* Central Floating Camera Action Pill */}
        <button
          onClick={() => setActiveTab('doctor')}
          className="flex flex-col items-center justify-center -mt-5 cursor-pointer group"
        >
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#0b66e4] to-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/35 border-4 border-white active:scale-90 transition">
            <IconCamera className="w-6 h-6 text-white" />
          </div>
          <span className="text-[10px] font-extrabold text-[#0b66e4] mt-0.5">Scan</span>
        </button>

        <button
          onClick={() => setActiveTab('farm')}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition cursor-pointer ${
            activeTab === 'farm' ? 'text-emerald-600 font-extrabold' : 'text-slate-400 font-medium'
          }`}
        >
          <span className="text-xl">🌱</span>
          <span className="text-[10px] mt-0.5">Farm</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition cursor-pointer ${
            activeTab === 'profile' ? 'text-emerald-600 font-extrabold' : 'text-slate-400 font-medium'
          }`}
        >
          <span className="text-xl">👤</span>
          <span className="text-[10px] mt-0.5">Profile</span>
        </button>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { toLocalizedDigits, Language } from '../translations';
import { IconVolume2, IconCamera, IconShieldAlert, IconCheckCircle } from './Icons';

interface ScanHistoryProps {
  fieldId: number;
  t: Record<string, string>;
  lang: Language;
  onSpeak: (text: string) => void;
  onNavigateToScan: () => void;
}

export const ScanHistory: React.FC<ScanHistoryProps> = ({
  fieldId,
  t,
  lang,
  onSpeak,
  onNavigateToScan,
}) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/vision/history/${fieldId}`);
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load scan history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScan = async (scanId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmMsg =
      lang === 'kn' ? 'ಈ ಸ್ಕ್ಯಾನ್ ದಾಖಲೆಯನ್ನು ಅಳಿಸಲು ಖಚಿತವೇ?' :
      lang === 'mr' ? 'हा स्कॅन रेकॉर्ड हटवायचा आहे का?' :
      lang === 'hi' ? 'क्या आप इस स्कैन रिकॉर्ड को हटाना चाहते हैं?' :
      'Are you sure you want to delete this scan record?';
    
    if (!window.confirm(confirmMsg)) return;

    try {
      setDeletingId(scanId);
      const res = await fetch(`/api/vision/scans/${scanId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== scanId));
      }
    } catch (err) {
      console.error('Failed to delete scan:', err);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [fieldId]);

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">
            {t.scanHistoryTitle}
          </h2>
          <p className="text-xs text-slate-500">
            {t.scanHistorySubtitle}
          </p>
        </div>

        <button
          onClick={onNavigateToScan}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
        >
          <IconCamera className="w-4 h-4" />
          <span>{t.openCameraBtn}</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Loading 7-day scan history...
        </div>
      ) : history.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          <p className="mb-3">{t.noHistoryYet}</p>
          <button
            onClick={onNavigateToScan}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold cursor-pointer"
          >
            {t.openCameraBtn}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {history.map((scan) => {
            const isBlight = scan.predicted_class?.includes('Early Blight');
            const isHealthy = scan.predicted_class?.includes('Healthy');

            const badgeBg = isBlight
              ? 'bg-rose-100 text-rose-800 border-rose-200'
              : isHealthy
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : 'bg-amber-100 text-amber-800 border-amber-200';

            const audioText =
              lang === 'kn' ? scan.audio_text_kn :
              lang === 'mr' ? scan.audio_text_mr :
              lang === 'hi' ? scan.audio_text_hi :
              scan.audio_text_en || scan.treatment_summary;

            return (
              <div
                key={scan.id}
                className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex space-x-3.5 items-start hover:shadow-xs transition"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-xl bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-300 relative flex items-center justify-center">
                  {scan.thumbnail_base64 ? (
                    <img
                      src={scan.thumbnail_base64}
                      alt="Leaf Scan Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">{isHealthy ? '🌿' : '🍂'}</span>
                  )}
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center font-bold py-0.5">
                    {toLocalizedDigits(scan.confidence_pct, lang)}%
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                        {scan.severity_tier}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {scan.created_at?.split(' ')[0] || scan.created_at}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteScan(scan.id, e)}
                      disabled={deletingId === scan.id}
                      className="px-2 py-0.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer flex items-center space-x-1"
                      title={lang === 'kn' ? 'ಸ್ಕ್ಯಾನ್ ಅಳಿಸಿ' : lang === 'mr' ? 'स्कॅन हटवा' : lang === 'hi' ? 'स्कैन हटाएं' : 'Delete Scan'}
                    >
                      <span className="text-xs">🗑️</span>
                      <span className="text-[10px] font-semibold">
                        {deletingId === scan.id
                          ? '...'
                          : lang === 'kn' ? 'ಅಳಿಸಿ' : lang === 'mr' ? 'हटवा' : lang === 'hi' ? 'हटाएं' : 'Delete'}
                      </span>
                    </button>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {scan.diagnosis_title || scan.predicted_class}
                  </h4>

                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 mb-2">
                    {scan.treatment_summary}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                    <span className="text-slate-600 font-medium">
                      {t.affectedAreaLabel}: <strong className="text-slate-800">{toLocalizedDigits(scan.affected_area_pct, lang)}%</strong>
                    </span>

                    {audioText && (
                      <button
                        onClick={() => onSpeak(audioText)}
                        className="flex items-center space-x-1 text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        <IconVolume2 className="w-3.5 h-3.5" />
                        <span>{t.listenCureBtn}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

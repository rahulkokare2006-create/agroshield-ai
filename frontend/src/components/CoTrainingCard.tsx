import React, { useEffect, useState } from 'react';
import { Language, toLocalizedDigits } from '../translations';
import { IconShieldAlert } from './Icons';

interface CoTrainingCardProps {
  t: Record<string, string>;
  lang: Language;
}

export const CoTrainingCard: React.FC<CoTrainingCardProps> = ({ t, lang }) => {
  const [queueData, setQueueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'AGREEMENT' | 'DISAGREEMENT'>('ALL');

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/cotraining/queue');
      const data = await res.json();
      setQueueData(data);
    } catch (err) {
      console.error('Failed to load co-training queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleReview = async (itemId: number, decision: 'APPROVED' | 'CORRECTED') => {
    try {
      await fetch(`/api/cotraining/review/${itemId}?status=${decision}&notes=Agronomist+verified+via+active+learning`, {
        method: 'POST'
      });
      fetchQueue();
    } catch (err) {
      console.error('Review failed:', err);
    }
  };

  const items = queueData?.items || [];
  const filteredItems = items.filter((item: any) => {
    if (activeFilter === 'AGREEMENT') return item.agreement_status === 'MUTUAL_AGREEMENT';
    if (activeFilter === 'DISAGREEMENT') return item.agreement_status === 'DISAGREEMENT';
    return true;
  });

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 transition-all hover:shadow-md">
      {/* Novelty Architecture Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-800 text-base font-bold">
              🧬
            </span>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">
              Cross-Modal Co-Training & Expert Review Queue
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
              NOVELTY: Student-Teacher
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Our weather model (Tom-Cast) and vision model (CIE-Lab CV) act as <strong>independent views of the same event</strong>. When both agree, samples become <em>Strong Weak-Labels</em> for autonomous retraining without waiting for human labels. When they disagree, they are routed to the <em>Agronomist Expert Queue</em>.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200 cursor-pointer"
        >
          🔄 Refresh Stream
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-5">
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            Mutual Agreement (Weak-Labels)
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-emerald-950">
              {toLocalizedDigits(queueData?.auto_labeled_weak_labels || 0, lang)}
            </span>
            <span className="text-xs text-emerald-700 font-semibold">Auto-Retrained</span>
          </div>
          <span className="text-[10px] text-emerald-600 block mt-1">
            Vision & Tom-Cast mutually reinforce each other.
          </span>
        </div>

        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
            Disagreement (Expert Triage)
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-amber-950">
              {toLocalizedDigits(queueData?.expert_triage_pending || 0, lang)}
            </span>
            <span className="text-xs text-amber-800 font-semibold">Pending Review</span>
          </div>
          <span className="text-[10px] text-amber-700 block mt-1">
            Diverted to human plant pathologist queue.
          </span>
        </div>

        <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block">
            Co-Training Efficiency
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-purple-950">
              {queueData?.total_records > 0
                ? `${Math.round(((queueData?.auto_labeled_weak_labels || 0) / queueData.total_records) * 100)}%`
                : '100%'}
            </span>
            <span className="text-xs text-purple-800 font-semibold">Zero-Human Touch</span>
          </div>
          <span className="text-[10px] text-purple-700 block mt-1">
            Autonomous self-supervision rate.
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-100 text-xs">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
            activeFilter === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Observations ({items.length})
        </button>
        <button
          onClick={() => setActiveFilter('AGREEMENT')}
          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center space-x-1 ${
            activeFilter === 'AGREEMENT'
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <span>✅</span>
          <span>Mutual Agreement ({queueData?.auto_labeled_weak_labels || 0})</span>
        </button>
        <button
          onClick={() => setActiveFilter('DISAGREEMENT')}
          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center space-x-1 ${
            activeFilter === 'DISAGREEMENT'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <span>⚠️</span>
          <span>Expert Queue ({queueData?.expert_triage_pending || 0})</span>
        </button>
      </div>

      {/* Queue Items List */}
      {loading ? (
        <div className="text-center py-10 text-xs text-slate-400">Loading co-training stream...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500">
          No records found under this filter. Upload a leaf scan to observe live co-training triage!
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item: any) => {
            const isAgree = item.agreement_status === 'MUTUAL_AGREEMENT';
            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isAgree
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-amber-50/40 border-amber-300 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-black border border-slate-200 flex-shrink-0">
                      {item.thumbnail_base64 ? (
                        <img src={item.thumbnail_base64} alt="Leaf" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">🌿</div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                          isAgree
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {isAgree ? '✅ Mutual Agreement' : '⚠️ Cross-Modal Discrepancy'}
                        </span>
                        <span className="text-[10px] text-slate-400">{item.created_at}</span>
                      </div>

                      <div className="text-xs font-bold text-slate-900 mt-1">
                        View 1 (Vision): <span className="text-emerald-700">{item.vision_prediction}</span> ({item.vision_affected_area}% Area)
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium">
                        View 2 (Weather): <span className="text-slate-800 font-bold">Tom-Cast {item.weather_cum_dsv} DSV</span> ({item.weather_risk_tier} Risk)
                      </div>
                    </div>
                  </div>

                  {/* Actions / Status */}
                  <div className="flex sm:flex-col items-end gap-1.5 self-end sm:self-center">
                    {isAgree ? (
                      <span className="px-3 py-1 bg-emerald-600 text-white text-[10.5px] font-bold rounded-xl shadow-2xs">
                        ⚡ Auto-Retrained
                      </span>
                    ) : item.expert_review_status === 'APPROVED' ? (
                      <span className="px-3 py-1 bg-blue-600 text-white text-[10.5px] font-bold rounded-xl">
                        ✓ Expert Verified
                      </span>
                    ) : (
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleReview(item.id, 'APPROVED')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition cursor-pointer shadow-xs"
                          title="Confirm diagnosis as valid fungal infection"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview(item.id, 'CORRECTED')}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold rounded-lg transition cursor-pointer"
                          title="Flag as physiological blemish or sunburn"
                        >
                          Correct
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Explanation note */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[10.5px] text-slate-600 leading-snug">
                  <strong>Pipeline Decision:</strong> {item.expert_notes}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

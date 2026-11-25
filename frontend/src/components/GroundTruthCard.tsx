import React, { useState, useEffect } from 'react';
import { IconCheckCircle } from './Icons';

interface GroundTruthCardProps {
  fieldId: number;
  currentRiskTier: string;
  currentCumDsv: number;
  t: Record<string, string>;
}

export const GroundTruthCard: React.FC<GroundTruthCardProps> = ({
  fieldId,
  currentRiskTier,
  currentCumDsv,
  t,
}) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [symptomDate, setSymptomDate] = useState('');
  const [agronomistName, setAgronomistName] = useState('Dr. Sharma (KVK Kolar)');
  const [leadTime, setLeadTime] = useState('48');
  const [predictionAccuracy, setPredictionAccuracy] = useState('TRUE_POSITIVE');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/ground-truth/logs/${fieldId}`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load ground truth logs:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fieldId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg('');

    try {
      await fetch('/api/ground-truth/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_id: fieldId,
          forecasted_risk_tier: currentRiskTier,
          forecasted_cum_dsv: currentCumDsv,
          actual_symptom_date: symptomDate || new Date().toISOString().split('T')[0],
          agronomist_confirmed: agronomistName,
          lead_time_hours: parseFloat(leadTime) || 48.0,
          prediction_accuracy: predictionAccuracy,
          notes: 'Empirical verification recorded for model benchmark trial.',
        }),
      });
      setStatusMsg('Logged successfully for empirical trial evaluation.');
      fetchLogs();
    } catch (err) {
      setStatusMsg('Error saving log.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 transition-all hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <IconCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">
              {t.groundTruthTitle}
            </h2>
            <p className="text-xs text-slate-500">
              {t.groundTruthSubtitle}
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
          Field Benchmark
        </span>
      </div>

      {/* Verification Submission Form */}
      <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 my-4 text-xs">
        <div className="font-bold text-slate-800 mb-2">{t.recordObservationTitle}</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-slate-500 block mb-1">{t.forecastedRiskLabel}</label>
            <input
              type="text"
              readOnly
              value={`${currentRiskTier} (DSV: ${currentCumDsv})`}
              className="w-full bg-slate-200/70 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold"
            />
          </div>
          <div>
            <label className="text-slate-500 block mb-1">{t.firstSymptomDateLabel}</label>
            <input
              type="date"
              value={symptomDate}
              onChange={(e) => setSymptomDate(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
            />
          </div>
          <div>
            <label className="text-slate-500 block mb-1">{t.agronomistLabel}</label>
            <input
              type="text"
              value={agronomistName}
              onChange={(e) => setAgronomistName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
            />
          </div>
          <div>
            <label className="text-slate-500 block mb-1">{t.leadTimeLabel}</label>
            <input
              type="number"
              value={leadTime}
              onChange={(e) => setLeadTime(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <label className="text-slate-500">{t.accuracyLabel}:</label>
            <select
              value={predictionAccuracy}
              onChange={(e) => setPredictionAccuracy(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 font-medium"
            >
              <option value="TRUE_POSITIVE">True Positive (Pre-symptomatic alert confirmed)</option>
              <option value="FALSE_POSITIVE">False Positive (Alert triggered, no symptoms)</option>
              <option value="TRUE_NEGATIVE">True Negative (Low risk, crop healthy)</option>
              <option value="FALSE_NEGATIVE">False Negative (Missed early infection)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer"
          >
            {submitting ? 'Saving...' : t.saveLogBtn}
          </button>
        </div>

        {statusMsg && (
          <div className="mt-2 text-emerald-700 font-medium">{statusMsg}</div>
        )}
      </form>

      {/* Log Table */}
      <div className="mt-4 overflow-x-auto">
        <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
          {t.empiricalLogTableTitle}
        </h4>
        <table className="w-full text-left text-xs text-slate-600 border border-slate-200 rounded-xl overflow-hidden">
          <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
            <tr>
              <th className="p-2.5">Date</th>
              <th className="p-2.5">Forecast Risk</th>
              <th className="p-2.5">Lead Time</th>
              <th className="p-2.5">Accuracy</th>
              <th className="p-2.5">Evaluator</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-3 text-center text-slate-400">
                  No empirical logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-medium text-slate-800">{log.actual_symptom_date}</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      log.forecasted_risk_tier === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {log.forecasted_risk_tier} (DSV: {log.forecasted_cum_dsv})
                    </span>
                  </td>
                  <td className="p-2.5 font-bold">{log.lead_time_hours}h</td>
                  <td className="p-2.5 text-emerald-700 font-semibold">{log.prediction_accuracy}</td>
                  <td className="p-2.5 text-slate-500">{log.agronomist_confirmed}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

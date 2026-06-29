import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Activity, Play, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { fetchAPI } from '../../lib/api';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
}

export default function SimulatorModal({ isOpen, onClose, task }: SimulatorModalProps) {
  const [scenario, setScenario] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const predefinedScenarios = [
    "Postpone this task until tomorrow",
    "Skip this task completely",
    "Reduce scope by 50%"
  ];

  const handleSimulate = async (customScenario: string = scenario) => {
    if (!customScenario.trim()) return;
    setScenario(customScenario);
    setSimulating(true);
    setResult(null);

    try {
      const output = await fetchAPI('/ai/simulate', {
        method: 'POST',
        body: JSON.stringify({
          taskId: task.id,
          title: task.title,
          scenario: customScenario
        })
      });
      setResult(output);
    } catch (err) {
      console.error(err);
      setResult({
        impact: "Simulation failed. The probability engine is temporarily offline.",
        newProbability: 0,
        recommendation: "Please try again later."
      });
    } finally {
      setSimulating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-deep-space-violet border border-rich-violet/80 w-full max-w-lg rounded-[24px] p-6 relative overflow-y-auto max-h-[90vh] custom-scrollbar"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-bold text-off-white flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-bright-teal" />
            "What if..." Simulator
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Test a decision on "{task?.title}" before committing.
          </p>

          <div className="space-y-4 mb-6">
            <div className="flex gap-2 flex-wrap">
              {predefinedScenarios.map((scen, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSimulate(scen)}
                  className="text-xs bg-rich-violet/40 hover:bg-rich-violet/60 border border-rich-violet/60 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {scen}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                value={scenario}
                onChange={e => setScenario(e.target.value)}
                placeholder="Or type a custom scenario..."
                className="flex-1 px-4 py-2 bg-slate-950/50 border border-rich-violet/80 text-off-white text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-bright-teal"
              />
              <button
                onClick={() => handleSimulate()}
                disabled={!scenario.trim() || simulating}
                className="px-4 py-2 bg-bright-teal/20 text-bright-teal border border-bright-teal/40 rounded-lg hover:bg-bright-teal/30 disabled:opacity-50 flex items-center gap-1 transition-colors"
              >
                {simulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Run
              </button>
            </div>
          </div>

          {result && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="border-t border-rich-violet/60 pt-6 mt-4"
            >
              <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Simulation Results</h3>
              
              <div className="bg-slate-950/50 p-4 rounded-xl border border-rich-violet/40 space-y-4">
                {result.analysis && (
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">AI Reasoning Engine</p>
                    <p className="text-sm text-off-white leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-rich-violet/30 italic">{result.analysis}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Projected Impact</p>
                  <p className="text-sm text-off-white leading-relaxed">{result.impact}</p>
                </div>
                
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Success Probability Shift</p>
                  <div className="flex items-center gap-4">
                    {result.originalProbability && (
                      <div className="text-center opacity-60 line-through text-slate-400">
                        <span className="text-lg font-bold block">{result.originalProbability}%</span>
                        <span className="text-[10px] uppercase tracking-wider block">Original</span>
                      </div>
                    )}
                    <span className={`text-2xl font-bold ${result.newProbability > 70 ? 'text-emerald-400' : result.newProbability > 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {result.newProbability}%
                    </span>
                    <div className="flex-1 h-1.5 bg-rich-violet/60 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${result.newProbability > 70 ? 'bg-emerald-400' : result.newProbability > 40 ? 'bg-amber-400' : 'bg-rose-500'}`} 
                        style={{ width: `${result.newProbability}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border flex flex-col gap-2 ${
                  result.newProbability > 70 ? 'bg-emerald-500/10 border-emerald-500/30' : 
                  'bg-rose-500/10 border-rose-500/30'
                }`}>
                  <div className="flex items-start gap-2">
                    {result.newProbability > 70 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <p className={`text-xs ${result.newProbability > 70 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      <span className="font-bold block mb-0.5">AI Recommendation:</span>
                      {result.recommendation}
                    </p>
                  </div>
                  
                  {result.recommendedAlternative && (
                    <div className="mt-1 pt-2 border-t border-rose-500/20 flex items-start gap-2">
                      <Activity className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-300">
                        <span className="font-bold block mb-0.5">Recommended Alternative:</span>
                        {result.recommendedAlternative}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}

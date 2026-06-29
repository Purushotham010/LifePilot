import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../lib/api';
import { Lightbulb, Zap, Clock, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SmartAlerts() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingTask, setAnalyzingTask] = useState<string | null>(null);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  useEffect(() => {
    fetchAPI('/tasks').then(res => {
      const pending = res.filter((t: any) => t.status !== 'Completed');
      const riskScore = { 'High': 3, 'Medium': 2, 'Low': 1 };
      pending.sort((a: any, b: any) => {
        return (riskScore[b.riskLevel as keyof typeof riskScore] || 0) - (riskScore[a.riskLevel as keyof typeof riskScore] || 0);
      });
      setTasks(pending);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const handleRescue = async (task: any) => {
    if (task.rescuePlan) {
      setActivePlanId(activePlanId === task.id ? null : task.id);
      return;
    }
    
    setAnalyzingTask(task.id);
    try {
      const plan = await fetchAPI('/ai/rescue-plan', {
        method: 'POST',
        body: JSON.stringify({
          taskId: task.id,
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          timeRemaining: "Unknown"
        })
      });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, rescuePlan: JSON.stringify(plan) } : t));
      setActivePlanId(task.id);
    } catch (e) {
      console.error(e);
    }
    setAnalyzingTask(null);
  };

  const getRiskColor = (level: string, priority: string) => {
    if (level === 'High' || priority === 'Critical') return 'border-rose-500/50 bg-rose-500/10';
    if (level === 'Medium') return 'border-amber-500/50 bg-amber-500/10';
    return 'border-bright-teal/50 bg-bright-teal/10';
  };

  if (loading) {
    return <div className="p-8 text-slate-400 flex items-center justify-center min-h-[50vh]"><Loader2 className="w-6 h-6 mr-3 animate-spin text-bright-teal" /> Scanning tasks for timeline risks...</div>;
  }

  const highRisk = tasks.filter(t => t.riskLevel === 'High' || t.priority === 'Critical');

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full overflow-y-auto">
      <div className="mb-8 flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <Lightbulb className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-off-white">Smart Alerts</h1>
          <p className="text-slate-400">Proactive suggestions to help you stay on track and meet your deadlines.</p>
        </div>
      </div>

      {highRisk.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-deep-space-violet border border-bright-teal/30 p-12 rounded-xl text-center"
        >
          <CheckCircle className="w-16 h-16 text-bright-teal mx-auto mb-4" />
          <h3 className="text-xl font-medium text-off-white">All Clear</h3>
          <p className="text-slate-400 mt-2">No tasks are currently at high risk of missing their deadlines.</p>
        </motion.div>
      ) : (
        <div className="grid gap-6">
          {highRisk.map((task) => (
            <motion.div 
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border ${getRiskColor(task.riskLevel, task.priority)} rounded-xl p-6 transition-all`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Needs Attention</span>
                  </div>
                  <h3 className="text-lg font-medium text-off-white">{task.title}</h3>
                  <p className="text-slate-400 text-sm mt-1">{task.riskReason || "Time is running out based on historical pacing vs. deadline."}</p>
                </div>
                
                <button
                  onClick={() => handleRescue(task)}
                  disabled={analyzingTask === task.id}
                  className="px-5 py-2.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/50 rounded-lg flex items-center font-medium transition-colors disabled:opacity-50 shrink-0"
                >
                  {analyzingTask === task.id ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Plan...</>
                  ) : (
                    <><Zap className="w-4 h-4 mr-2" /> {task.rescuePlan && activePlanId === task.id ? 'Hide Plan' : 'Get Action Plan'}</>
                  )}
                </button>
              </div>

              <AnimatePresence>
                {activePlanId === task.id && task.rescuePlan && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-6"
                  >
                    <div className="pt-6 border-t border-rose-500/20">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-off-white mb-4 flex items-center">
                        <Zap className="w-4 h-4 mr-2 text-amber-400" /> Step-by-Step Guide
                      </h4>
                      <div className="grid gap-4 md:grid-cols-3">
                        {JSON.parse(task.rescuePlan).map((step: any, idx: number) => (
                          <div key={idx} className="bg-rich-violet/40 p-4 rounded-lg border border-white/5">
                            <span className="text-xs font-semibold text-bright-teal uppercase tracking-wider mb-2 block">{step.timeframe}</span>
                            <p className="text-off-white font-medium text-sm mb-2">{step.action}</p>
                            <p className="text-slate-400 text-xs">{step.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

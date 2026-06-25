import { useState, useEffect } from 'react';
import { fetchAPI } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { Target, Activity, CheckSquare, Clock, ArrowRight, BrainCircuit, ShieldAlert, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isResetting, setIsResetting] = useState(false);

  const loadData = () => {
    fetchAPI('/dashboard')
      .then(setData)
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRestoreDemo = async () => {
    try {
      setIsResetting(true);
      const res = await fetchAPI('/seed-sample', {
        method: 'POST'
      });
      if (res.success) {
        loadData();
      }
    } catch (err) {
      console.error("Failed to restore demo:", err);
    } finally {
      setIsResetting(false);
    }
  };

  if (!data) return null;

  const atRiskTasks = data.priorityTasks.filter((t: any) => t.riskLevel === 'High');

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-off-white">Good morning, {user?.name ? user.name.split(' ')[0] : 'User'}</h1>
          <p className="text-slate-400 mt-1">Here is your productivity snapshot for today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRestoreDemo}
            className="px-4 py-2 text-xs font-semibold text-bright-teal bg-bright-teal/10 hover:bg-bright-teal/20 border border-bright-teal/30 rounded-xl transition duration-200 cursor-pointer"
            disabled={isResetting}
          >
            {isResetting ? "Seeding..." : "Reset to Sample Scenario"}
          </button>
          <Link
            to="/"
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-rich-violet/40 hover:bg-rich-violet/60 border border-rich-violet/60 rounded-xl transition duration-200"
          >
            Back to Home Screen
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-deep-space-violet/40 p-6 rounded-[20px] border border-rich-violet/60 backdrop-blur-sm shadow-none relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-bright-teal/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="font-semibold text-slate-300 font-sans">Productivity Score</h3>
            <div className="p-2 bg-bright-teal/10 rounded-lg"><Activity className="w-5 h-5 text-bright-teal" /></div>
          </div>
          <div className="text-4xl font-bold text-off-white relative z-10">{data.metrics.score}</div>
          <p className="text-sm text-slate-400 mt-2 flex items-center relative z-10">
             Based on completion rate
          </p>
        </div>

        <div className="bg-deep-space-violet/40 p-6 rounded-[20px] border border-rich-violet/60 backdrop-blur-sm shadow-none relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="font-semibold text-slate-300 font-sans">Pending Tasks</h3>
            <div className="p-2 bg-amber-500/10 rounded-lg"><Clock className="w-5 h-5 text-amber-400" /></div>
          </div>
          <div className="text-4xl font-bold text-off-white relative z-10">{data.metrics.pendingCount}</div>
          <p className="text-sm text-slate-400 mt-2 relative z-10">Active items on your plate</p>
        </div>

        <div className="bg-deep-space-violet/40 p-6 rounded-[20px] border border-rich-violet/60 backdrop-blur-sm shadow-none relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="font-semibold text-slate-300 font-sans">Completed Tasks</h3>
            <div className="p-2 bg-emerald-500/10 rounded-lg"><CheckSquare className="w-5 h-5 text-emerald-400" /></div>
          </div>
          <div className="text-4xl font-bold text-off-white relative z-10">{data.metrics.completedCount}</div>
          <p className="text-sm text-slate-400 mt-2 relative z-10">Great job staying on track!</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-rich-violet/20 via-deep-space-violet to-rich-violet/10 rounded-[20px] p-8 text-off-white flex flex-col md:flex-row items-center justify-between border border-bright-teal/20 shadow-none"
      >
        <div className="mb-6 md:mb-0 max-w-lg">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-bright-teal" />
            AI Daily Briefing
          </h2>
          <p className="text-slate-300 leading-relaxed">
            You have <strong className="text-bright-teal bg-bright-teal/10 px-1.5 py-0.5 rounded border border-bright-teal/20">{data.priorityTasks.length} high priority</strong> tasks today. 
            {atRiskTasks.length > 0 ? (
              <span className="block mt-2">
                <strong className="text-rose-400">Warning:</strong> {atRiskTasks.length} task(s) are at <strong className="text-rose-400">HIGH RISK</strong> of missing deadlines. Please review your agenda and activate Rescue Mode if needed.
              </span>
            ) : (
              <span className="block mt-2">
                I recommend starting with "{data.priorityTasks[0]?.title || 'planning your day'}" to maximize your uninterrupted focus blocks.
              </span>
            )}
          </p>
        </div>
        <Link to="/tasks" className="px-6 py-3 bg-bright-teal text-deep-space-violet font-semibold rounded-lg hover:bg-bright-teal/90 transition flex items-center gap-2 shrink-0 shadow-none">
          View Agenda <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
      
      {/* Gamification Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Streaks */}
        <div className="bg-deep-space-violet/40 p-6 rounded-[20px] border border-rich-violet/60 backdrop-blur-sm shadow-none">
          <h3 className="text-lg font-semibold text-off-white flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-amber-500" /> Daily Streak
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <span className="text-2xl font-bold text-white">5</span>
            </div>
            <div>
              <p className="text-off-white font-medium">You're on fire!</p>
              <p className="text-sm text-slate-400">5 days of consistent productivity.</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {['M', 'T', 'W', 'T', 'F'].map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-2 rounded-full bg-amber-500"></div>
                <span className="text-xs text-slate-500 font-medium">{day}</span>
              </div>
            ))}
            {['S', 'S'].map((day, i) => (
              <div key={i+5} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-2 rounded-full bg-rich-violet/60"></div>
                <span className="text-xs text-slate-600 font-medium">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="bg-deep-space-violet/40 p-6 rounded-[20px] border border-rich-violet/60 backdrop-blur-sm shadow-none">
          <h3 className="text-lg font-semibold text-off-white flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-emerald-400" /> Recent Badges
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-rich-violet/30 border border-rich-violet/60">
              <div className="p-2 bg-emerald-500/20 rounded-full mb-2">
                <CheckSquare className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-slate-300 text-center">Task Master</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-rich-violet/30 border border-rich-violet/60">
              <div className="p-2 bg-bright-teal/20 rounded-full mb-2">
                <BrainCircuit className="w-6 h-6 text-bright-teal" />
              </div>
              <span className="text-xs font-medium text-slate-300 text-center">AI Planner</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-rich-violet/30 border border-rich-violet/60 opacity-50 grayscale">
              <div className="p-2 bg-slate-500/20 rounded-full mb-2">
                <Activity className="w-6 h-6 text-slate-400" />
              </div>
              <span className="text-xs font-medium text-slate-500 text-center">100 Tasks</span>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* At-Risk Tasks Highlight Section */}
      {atRiskTasks.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-rose-950/20 border border-rose-500/30 rounded-[20px] p-6"
        >
          <h3 className="text-lg font-semibold text-rose-400 flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5" /> Urgent Intervention Required
          </h3>
          <div className="space-y-3">
            {atRiskTasks.map((task: any) => (
              <div key={task.id} className="bg-deep-space-violet/40 p-4 rounded-xl border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-medium text-off-white">{task.title}</h4>
                  <p className="text-sm text-rose-300/80 mt-1">{task.riskReason || 'Deadline approaching fast.'}</p>
                </div>
                <Link to="/tasks" className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-lg hover:bg-rose-500/20 transition-colors whitespace-nowrap">
                  Open Rescue Mode
                </Link>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

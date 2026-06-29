import { useState, useEffect } from 'react';
import { fetchAPI } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { Target, Activity, CheckSquare, Clock, ArrowRight, BrainCircuit, ShieldAlert, Flame, PhoneCall } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import VoiceCoach from '../components/features/VoiceCoach';

import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { app } from '../lib/firestore'; // Import app from firestore

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar');

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [voiceCoachOpen, setVoiceCoachOpen] = useState(false);
  const [voiceCoachTask, setVoiceCoachTask] = useState<any | null>(null);
  
  const [activeReason, setActiveReason] = useState<string | null>(null);

  const toggleReason = (type: string) => {
    setActiveReason(activeReason === type ? null : type);
  };

  const loadData = () => {
    fetchAPI('/dashboard')
      .then(res => {
        setData(res);
        // Proactively open voice coach if high-risk tasks exist and we haven't bugged them this session
        const atRisk = res.priorityTasks?.filter((t: any) => t.riskLevel === 'High') || [];
        if (atRisk.length > 0 && !sessionStorage.getItem('voice_coach_prompted')) {
           sessionStorage.setItem('voice_coach_prompted', 'true');
           // Slight delay for dramatic effect
           setTimeout(() => {
             setVoiceCoachTask(atRisk[0]);
             setVoiceCoachOpen(true);
           }, 2000);
        }
      })
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

  const handleClearData = async () => {
    try {
      setIsResetting(true); // Reuse the same loading state for simplicity
      const res = await fetchAPI('/clear-data', {
        method: 'POST'
      });
      if (res.success) {
        loadData();
      }
    } catch (err) {
      console.error("Failed to clear data:", err);
    } finally {
      setIsResetting(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (!data) return null;

  const atRiskTasks = data.priorityTasks.filter((t: any) => t.riskLevel === 'High');

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-off-white">{getGreeting()}, {user?.name ? user.name.split(' ')[0] : 'User'}</h1>
          <p className="text-slate-400 mt-1">Here is your productivity snapshot for today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={async () => {
              try {
                const result = await signInWithPopup(auth, provider);
                const credential = GoogleAuthProvider.credentialFromResult(result);
                if (credential?.accessToken) {
                  const syncRes = await fetchAPI('/calendar/sync', {
                    method: 'POST',
                    body: JSON.stringify({ token: credential.accessToken })
                  });
                  if (syncRes) loadData();
                }
              } catch (e: any) {
                console.error("Calendar sync error", e);
                if (e.code !== 'auth/popup-closed-by-user') {
                  alert("Failed to connect Google Calendar. Ensure popups are allowed.");
                }
              }
            }}
            className="px-4 py-2 text-xs font-semibold text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/30 rounded-xl transition duration-200 cursor-pointer"
          >
            Connect Google Calendar
          </button>
          <button
            onClick={handleRestoreDemo}
            className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl transition duration-200 cursor-pointer"
            disabled={isResetting}
          >
            {isResetting ? "Loading..." : "Load Sample Data"}
          </button>
          <button
            onClick={handleClearData}
            className="px-4 py-2 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition duration-200 cursor-pointer"
            disabled={isResetting}
          >
            {isResetting ? "Clearing..." : "Clear Sample Data"}
          </button>
          <Link
            to="/"
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-rich-violet/40 hover:bg-rich-violet/60 border border-rich-violet/60 rounded-xl transition duration-200"
          >
            Back to Home Screen
          </Link>
        </div>
      </div>

      {data.metrics.totalTasks === 0 ? (
        <div className="bg-deep-space-violet/40 border border-rich-violet/60 rounded-[20px] p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-bright-teal/10 rounded-full flex items-center justify-center mb-6">
            <Target className="w-8 h-8 text-bright-teal" />
          </div>
          <h2 className="text-2xl font-bold text-off-white mb-2">Your Workspace is Empty</h2>
          <p className="text-slate-400 max-w-md mb-8">
            You don't have any tasks scheduled. Start by adding your goals or load sample data to see the AI in action.
          </p>
          <div className="flex gap-4">
            <Link to="/tasks" className="px-6 py-3 bg-bright-teal text-deep-space-violet font-semibold rounded-lg hover:bg-bright-teal/90 transition shadow-none">
              Create a Task
            </Link>
            <button
              onClick={handleRestoreDemo}
              disabled={isResetting}
              className="px-6 py-3 text-off-white bg-slate-800 hover:bg-slate-700 border border-slate-600 font-semibold rounded-lg transition duration-200 cursor-pointer shadow-none"
            >
              {isResetting ? "Loading..." : "Load Sample Data"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-deep-space-violet/40 p-6 rounded-[20px] border border-rich-violet/60 backdrop-blur-sm shadow-none relative overflow-hidden group flex flex-col h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-bright-teal/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="font-semibold text-slate-300 font-sans cursor-pointer flex items-center gap-2" onClick={() => toggleReason('confidence')}>
              Completion Confidence
              <span className="text-[10px] bg-rich-violet/60 px-1.5 py-0.5 rounded-full hover:bg-bright-teal hover:text-deep-space-violet transition-colors">Why?</span>
            </h3>
            <div className="p-2 bg-bright-teal/10 rounded-lg"><BrainCircuit className="w-5 h-5 text-bright-teal" /></div>
          </div>
          
          {activeReason === 'confidence' && data.metrics.confidenceReason && (
            <div className="absolute top-12 left-6 right-6 bg-slate-900 border border-bright-teal/50 p-3 rounded-lg z-20 shadow-xl text-xs text-slate-300">
              <span className="font-bold text-bright-teal block mb-1">AI Reasoning:</span>
              {data.metrics.confidenceReason}
            </div>
          )}

          <div className="flex items-end gap-2 relative z-10 mt-auto">
            <span className="text-4xl font-bold text-off-white">{data.metrics.overallConfidence}%</span>
          </div>
          <div className="w-full h-1.5 bg-rich-violet/60 rounded-full mt-3 overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${data.metrics.overallConfidence > 80 ? 'bg-bright-teal' : data.metrics.overallConfidence > 50 ? 'bg-amber-400' : 'bg-rose-500'}`} style={{ width: `${data.metrics.overallConfidence}%` }}></div>
          </div>
          <p className="text-xs text-slate-400 mt-2 relative z-10">AI Projection based on workload</p>
        </div>

        <div className="bg-deep-space-violet/40 p-6 rounded-[20px] border border-rich-violet/60 backdrop-blur-sm shadow-none relative overflow-hidden group flex flex-col h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="font-semibold text-slate-300 font-sans cursor-pointer flex items-center gap-2" onClick={() => toggleReason('buffer')}>
              Remaining Safe Buffer
              <span className="text-[10px] bg-rich-violet/60 px-1.5 py-0.5 rounded-full hover:bg-amber-400 hover:text-deep-space-violet transition-colors">Why?</span>
            </h3>
            <div className="p-2 bg-amber-500/10 rounded-lg"><Clock className="w-5 h-5 text-amber-400" /></div>
          </div>
          
          {activeReason === 'buffer' && data.metrics.safeBufferReason && (
            <div className="absolute top-12 left-6 right-6 bg-slate-900 border border-amber-500/50 p-3 rounded-lg z-20 shadow-xl text-xs text-slate-300">
              <span className="font-bold text-amber-400 block mb-1">AI Reasoning:</span>
              {data.metrics.safeBufferReason}
            </div>
          )}

          <div className="text-4xl font-bold text-off-white relative z-10 mt-auto">{data.metrics.safeBufferMins}m</div>
          <p className="text-xs text-slate-400 mt-2 relative z-10">Buffer time before deadlines are compromised</p>
        </div>

        <div className="bg-deep-space-violet/40 p-6 rounded-[20px] border border-rich-violet/60 backdrop-blur-sm shadow-none relative overflow-hidden group flex flex-col h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="font-semibold text-slate-300 font-sans">Current AI Focus</h3>
            <div className="p-2 bg-emerald-500/10 rounded-lg"><Target className="w-5 h-5 text-emerald-400" /></div>
          </div>
          
          <div className="mt-auto z-10">
            <div className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-1">Objective</div>
            <div className="text-lg font-bold text-off-white leading-tight mb-2">Workflow Support via Focus Plan</div>
            <div className="bg-slate-950/50 p-2 rounded border border-emerald-500/20 text-xs text-slate-300">
              <span className="text-emerald-400 font-semibold block mb-0.5">Action:</span>
              Supporting 1 urgent task to ensure on-time completion.
            </div>
          </div>
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
                <strong className="text-rose-400">Notice:</strong> {atRiskTasks.length} task(s) <strong className="text-rose-400">NEED ATTENTION</strong>. I have generated a Focus Plan to stabilize your workflow.
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
      
      {/* AI Reasoning Timeline & Live Feed */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Live Feed */}
        <div className="bg-deep-space-violet/40 p-6 rounded-[20px] border border-rich-violet/60 backdrop-blur-sm shadow-none flex flex-col h-80">
          <h3 className="text-lg font-semibold text-off-white flex items-center gap-2 mb-4 shrink-0">
            <Activity className="w-5 h-5 text-bright-teal" /> Live AI Activity Feed
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 font-mono text-sm">
            {data.liveFeed?.map((item: any) => (
              <div key={item.id} className="flex gap-3 items-start border-l-2 border-rich-violet/40 pl-3 py-1 relative">
                <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-deep-space-violet ${
                  item.type === 'intervention' ? 'bg-rose-500' :
                  item.type === 'prediction' ? 'bg-amber-400' :
                  'bg-bright-teal'
                }`}></div>
                <div>
                  <span className="text-slate-500 text-xs block mb-0.5">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  <span className="text-slate-300">{item.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Upcoming Interventions */}
        <div className="bg-deep-space-violet/40 p-6 rounded-[20px] border border-rich-violet/60 backdrop-blur-sm shadow-none h-80 flex flex-col">
          <h3 className="text-lg font-semibold text-off-white flex items-center gap-2 mb-4 shrink-0">
            <Target className="w-5 h-5 text-emerald-400" /> Projected Outcomes
          </h3>
          <div className="flex-1 flex flex-col justify-center space-y-4">
             <div className="bg-rich-violet/20 p-4 rounded-xl border border-rich-violet/40">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-medium">Without AI Guidance</span>
                  <span className={`font-bold ${data.metrics.withoutGuidance < 50 ? 'text-rose-400' : 'text-amber-400'}`}>{data.metrics.withoutGuidance}%</span>
                </div>
                <div className="w-full h-1.5 bg-rich-violet/60 rounded-full mt-2 overflow-hidden">
                  <div className={`h-full ${data.metrics.withoutGuidance < 50 ? 'bg-rose-500' : 'bg-amber-400'}`} style={{ width: `${data.metrics.withoutGuidance}%` }}></div>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {data.metrics.withoutGuidance < 50 ? "High probability of missed deadlines due to buffer exhaustion." : "Moderate risk of falling behind schedule."}
                </p>
             </div>
             
             <div className="bg-bright-teal/10 p-4 rounded-xl border border-bright-teal/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-bright-teal font-medium">With Focus Plan</span>
                  <span className="text-bright-teal font-bold">{data.metrics.overallConfidence}%</span>
                </div>
                <div className="w-full h-1.5 bg-rich-violet/60 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-bright-teal" style={{ width: `${data.metrics.overallConfidence}%` }}></div>
                </div>
                <p className="text-xs text-bright-teal/80 mt-2">Tasks re-prioritized. Important timeline protected.</p>
             </div>
          </div>
        </div>
      </motion.div>
      
      {/* Needs Attention Tasks Highlight Section */}
      {atRiskTasks.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-rose-950/20 border border-rose-500/30 rounded-[20px] p-6"
        >
          <h3 className="text-lg font-semibold text-rose-400 flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5" /> Action Required
          </h3>
          <div className="space-y-3">
            {atRiskTasks.map((task: any) => (
              <div key={task.id} className="bg-deep-space-violet/40 p-4 rounded-xl border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium text-off-white">{task.title}</h4>
                  <p className="text-sm text-rose-300/80 mt-1">{task.riskReason || 'Deadline approaching fast.'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setVoiceCoachTask(task);
                      setVoiceCoachOpen(true);
                    }}
                    className="text-xs bg-bright-teal/10 text-bright-teal border border-bright-teal/30 px-3 py-1.5 rounded-lg hover:bg-bright-teal/20 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer font-semibold"
                  >
                    <PhoneCall className="w-3.5 h-3.5 animate-pulse" /> Focus Call
                  </button>
                  <Link to="/tasks" className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-lg hover:bg-rose-500/20 transition-colors whitespace-nowrap">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <VoiceCoach 
        isOpen={voiceCoachOpen}
        onClose={() => {
          setVoiceCoachOpen(false);
          setVoiceCoachTask(null);
        }}
        task={voiceCoachTask}
      />
      </>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchAPI } from '../lib/api';
import { Plus, Sparkles, Loader2, Calendar, Target, Clock, AlertCircle, CheckSquare, ShieldAlert, AlertTriangle, Flame, Mic, MicOff, PhoneCall, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import VoiceCoach from '../components/features/VoiceCoach';
import SimulatorModal from '../components/features/SimulatorModal';

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [breakingDown, setBreakingDown] = useState<string | null>(null);
  const [analyzingRisk, setAnalyzingRisk] = useState<string | null>(null);
  const [generatingRescue, setGeneratingRescue] = useState<string | null>(null);
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const [voiceCoachOpen, setVoiceCoachOpen] = useState(false);
  const [voiceCoachTask, setVoiceCoachTask] = useState<any | null>(null);

  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simulatorTask, setSimulatorTask] = useState<any | null>(null);

  const [activeReason, setActiveReason] = useState<{taskId: string, type: string} | null>(null);
  const [thinkingText, setThinkingText] = useState('Thinking...');

  const toggleReason = (taskId: string, type: string) => {
    if (activeReason?.taskId === taskId && activeReason.type === type) {
      setActiveReason(null);
    } else {
      setActiveReason({taskId, type});
    }
  };

  const simulateThinking = async (phases: string[], durationPerPhase: number = 600) => {
    for (const phase of phases) {
      setThinkingText(phase);
      await new Promise(r => setTimeout(r, durationPerPhase));
    }
  };

  useEffect(() => {
    loadTasks();
    
    // Setup Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setAiInput(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          console.warn("Speech recognition access denied. Please allow microphone access.");
        } else {
          console.warn("Speech recognition error:", event.error);
        }
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const loadTasks = async () => {
    try {
      const data = await fetchAPI('/tasks');
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreDemo = async () => {
    try {
      setIsResetting(true);
      const res = await fetchAPI('/seed-sample', {
        method: 'POST'
      });
      if (res.success) {
        loadTasks();
      }
    } catch (err) {
      console.error("Failed to restore demo:", err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleClearData = async () => {
    try {
      setIsResetting(true);
      const res = await fetchAPI('/clear-data', {
        method: 'POST'
      });
      if (res.success) {
        loadTasks();
      }
    } catch (err) {
      console.error("Failed to clear data:", err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleAiCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    setAnalyzing(true);
    try {
      simulateThinking([
        "Analyzing semantics...",
        "Estimating effort...",
        "Assigning priority...",
        "Finalizing schema..."
      ], 800);
      
      const analyzed = await fetchAPI('/ai/analyze-task', {
        method: 'POST',
        body: JSON.stringify({ text: aiInput })
      });
      
      const newTask = await fetchAPI('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: analyzed.title || 'Untitled Task',
          description: analyzed.description || '',
          priority: analyzed.priority || 'Medium',
          priorityReason: analyzed.priorityReason || '',
          difficulty: analyzed.difficulty || 'Medium',
          estimatedTime: analyzed.estimatedTime || 60,
          timeReason: analyzed.timeReason || '',
          deadline: analyzed.deadline ? new Date(analyzed.deadline).toISOString() : null
        })
      });

      setTasks(prev => [...prev, newTask]);
      setAiInput('');

      // Auto-analyze risk in background if deadline exists
      if (newTask.deadline) {
         handleRiskAnalysis(newTask);
      }

    } catch (err: any) {
      console.error(err);
      alert(`Error creating task: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRiskAnalysis = async (task: any) => {
    setAnalyzingRisk(task.id);
    try {
      const riskResult = await fetchAPI('/ai/risk-analysis', {
        method: 'POST',
        body: JSON.stringify({
          taskId: task.id,
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          priority: task.priority,
          estimatedTime: task.estimatedTime
        })
      });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, riskLevel: riskResult.riskLevel, riskReason: riskResult.riskReason } : t));
    } catch (err: any) {
      console.error("Failed to analyze risk", err);
      alert(`Error analyzing risk: ${err.message}`);
    } finally {
      setAnalyzingRisk(null);
    }
  };

  const handleRescuePlan = async (task: any) => {
    setGeneratingRescue(task.id);
    try {
      const plan = await fetchAPI('/ai/rescue-plan', {
        method: 'POST',
        body: JSON.stringify({
          taskId: task.id,
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          timeRemaining: "Calculated based on deadline" // Usually computed
        })
      });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, rescuePlan: JSON.stringify(plan), riskLevel: 'High' } : t));
    } catch (err: any) {
      console.error("Failed to generate rescue plan", err);
      alert(`Error generating rescue plan: ${err.message}`);
    } finally {
      setGeneratingRescue(null);
    }
  };

  const handleBreakdown = async (taskId: string, description: string) => {
    setBreakingDown(taskId);
    try {
      await fetchAPI('/ai/create-plan', {
        method: 'POST',
        body: JSON.stringify({ taskId, description })
      });
      await loadTasks();
    } catch (err: any) {
      console.error(err);
      alert(`Error breaking down task: ${err.message}`);
    } finally {
      setBreakingDown(null);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await fetchAPI(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      loadTasks();
    } catch(err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-bright-teal" /></div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-off-white">Task Intelligence</h1>
          <p className="text-slate-400">Plan, capture, and break down your goals automatically.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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

      <div className="bg-deep-space-violet/40 p-6 rounded-[20px] border border-rich-violet/60 backdrop-blur-sm shadow-none">
        <h2 className="text-lg font-semibold flex items-center mb-4 text-off-white">
          <Sparkles className="w-5 h-5 text-bright-teal mr-2 animate-pulse" />
          AI Task Capture
        </h2>
        <form onSubmit={handleAiCreate} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              placeholder="e.g. I have an interview on June 25th and need preparation"
              className="w-full pl-4 pr-12 py-3 bg-deep-space-violet border border-rich-violet/80 text-off-white placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-bright-teal focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={toggleListening}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                isListening ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'text-slate-400 hover:text-bright-teal hover:bg-rich-violet/30'
              }`}
            >
              {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
          </div>
          <button 
            type="submit" 
            disabled={analyzing || !aiInput.trim()}
            className="px-6 py-3 bg-bright-teal text-deep-space-violet font-medium rounded-lg disabled:opacity-50 hover:bg-bright-teal/90 transition-colors flex items-center justify-center gap-2 min-w-[140px]"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">{thinkingText}</span>
              </>
            ) : 'Analyze & Add'}
          </button>
        </form>
      </div>

      <div className="grid gap-4">
        <AnimatePresence>
          {tasks.map(task => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={task.id} 
              className={`bg-deep-space-violet/40 rounded-[20px] p-5 border backdrop-blur-sm transition-all shadow-none ${
                task.priority === 'Critical' ? 'border-rose-500/30 bg-rose-950/10' : 'border-rich-violet/60 hover:border-rich-violet/90'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className={`text-lg font-semibold ${task.status === 'Completed' ? 'line-through text-slate-500' : 'text-off-white'}`}>{task.title}</h3>
                    
                    {/* PRIORITY BADGE */}
                    <div className="relative">
                      <button 
                        onClick={() => toggleReason(task.id, 'priority')}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity
                        ${task.priority === 'Critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                          task.priority === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                          'bg-rich-violet/30 text-slate-300 border border-rich-violet/60'}`}>
                        {task.priority}
                      </button>
                      {activeReason?.taskId === task.id && activeReason.type === 'priority' && task.priorityReason && (
                        <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-slate-900 border border-rich-violet/60 rounded-xl z-20 shadow-xl shadow-black/50 text-xs text-slate-300">
                          <span className="font-bold text-bright-teal block mb-1">AI Reasoning:</span>
                          {task.priorityReason}
                        </div>
                      )}
                    </div>
                    
                    {/* ALERT BADGE */}
                    {task.riskLevel && task.riskLevel !== 'Low' && task.status !== 'Completed' && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1
                        ${task.riskLevel === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/40 animate-pulse' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {task.riskLevel} Alert
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2">{task.description}</p>
                  
                  {/* ALERT REASON */}
                  {task.riskReason && task.riskLevel === 'High' && task.status !== 'Completed' && (
                    <p className="text-xs text-rose-400/80 mt-1.5 flex items-start gap-1 max-w-lg">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {task.riskReason}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                  {task.deadline && (
                    <div className="flex items-center gap-1.5 bg-deep-space-violet/60 px-3 py-1.5 rounded-lg border border-rich-violet/60">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      {new Date(task.deadline).toLocaleDateString()}
                    </div>
                  )}
                  {task.estimatedTime && (
                    <div className="relative">
                      <button 
                        onClick={() => toggleReason(task.id, 'time')}
                        className="flex items-center gap-1.5 bg-deep-space-violet/60 px-3 py-1.5 rounded-lg border border-rich-violet/60 cursor-pointer hover:bg-rich-violet/40 transition-colors">
                        <Clock className="w-4 h-4 text-slate-500" />
                        {task.estimatedTime}m
                      </button>
                      {activeReason?.taskId === task.id && activeReason.type === 'time' && task.timeReason && (
                        <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-slate-900 border border-rich-violet/60 rounded-xl z-20 shadow-xl shadow-black/50 text-xs text-slate-300 text-left">
                          <span className="font-bold text-bright-teal block mb-1">AI Reasoning:</span>
                          {task.timeReason}
                        </div>
                      )}
                    </div>
                  )}
                  <select 
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                    className="bg-deep-space-violet border border-rich-violet/80 text-slate-300 text-sm rounded-lg focus:ring-bright-teal focus:border-bright-teal block px-2.5 py-1.5"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* AI Plan Section & Focus Mode */}
              <div className="mt-5 border-t border-rich-violet/60 pt-4">
                
                {/* FOCUS PLAN DISPLAY */}
                {task.rescuePlan ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" /> Action Plan Active
                      </h4>
                      <button
                        onClick={() => {
                          setVoiceCoachTask(task);
                          setVoiceCoachOpen(true);
                        }}
                        className="text-xs font-semibold text-bright-teal hover:text-bright-teal/80 flex items-center gap-1.5 border border-bright-teal/30 px-2.5 py-1 rounded-lg bg-bright-teal/10 hover:bg-bright-teal/25 transition cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
                        Live Voice Guide
                      </button>
                    </div>
                    <ul className="space-y-2">
                      {JSON.parse(task.rescuePlan).map((step: any, idx: number) => (
                        <li key={idx} className="flex flex-col text-sm text-rose-100 bg-rose-950/30 px-4 py-3 rounded-xl border border-rose-500/30 gap-2 relative group">
                          <div className="flex items-start">
                            <span className="font-bold text-rose-400 mr-2 shrink-0">{step.timeframe}:</span>
                            <span className="font-medium text-white">{step.action}</span>
                          </div>
                          {(step.reason || step.orderRationale) && (
                            <div className="pl-0 sm:pl-[4.5rem] mt-1 space-y-1">
                              {step.reason && (
                                <p className="text-xs text-rose-200/80"><span className="text-rose-400 font-semibold">Why:</span> {step.reason}</p>
                              )}
                              {step.orderRationale && (
                                <p className="text-xs text-rose-200/80"><span className="text-rose-400 font-semibold">Order:</span> {step.orderRationale}</p>
                              )}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : task.aiPlans && task.aiPlans.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-bright-teal" /> Action Plan
                    </h4>
                    <ul className="space-y-2">
                      {task.aiPlans.map((plan: any) => (
                        <li key={plan.id} className="flex items-start text-sm text-slate-300 bg-deep-space-violet/40 px-3 py-2 rounded-lg border border-rich-violet/40">
                          <CheckSquare className="w-4 h-4 mr-2 mt-0.5 text-bright-teal shrink-0" />
                          <span>{plan.step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 flex-wrap">
                    <button 
                      onClick={() => handleBreakdown(task.id, task.description || task.title)}
                      disabled={breakingDown === task.id}
                      className="text-sm font-medium text-bright-teal hover:text-bright-teal/80 flex items-center gap-1.5 transition-colors"
                    >
                      {breakingDown === task.id ? <Loader2 className="w-4 h-4 animate-spin text-bright-teal" /> : <Sparkles className="w-4 h-4" />}
                      Break down with AI
                    </button>

                    <button
                      onClick={() => {
                        setSimulatorTask(task);
                        setSimulatorOpen(true);
                      }}
                      className="text-sm font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors border border-amber-500/30 px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20"
                    >
                      <Activity className="w-4 h-4" />
                      "What if..." Simulator
                    </button>

                    {/* TRIGGER FOCUS PLAN BUTTON */}
                    {task.riskLevel === 'High' && task.status !== 'Completed' && (
                      <button 
                        onClick={() => handleRescuePlan(task)}
                        disabled={generatingRescue === task.id}
                        className="text-sm font-medium text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors ml-auto border border-rose-500/40 px-3 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20"
                      >
                        {generatingRescue === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                        Generate Focus Plan
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div className="text-center py-20 bg-deep-space-violet/20 rounded-[20px] border border-dashed border-rich-violet/60">
            <h3 className="text-lg font-medium text-slate-300">No tasks yet</h3>
            <p className="text-slate-500 mt-1">Use the AI capture above to plan your first project.</p>
          </div>
        )}
      </div>

      <VoiceCoach 
        isOpen={voiceCoachOpen}
        onClose={() => {
          setVoiceCoachOpen(false);
          setVoiceCoachTask(null);
        }}
        task={voiceCoachTask}
      />
      
      <SimulatorModal 
        isOpen={simulatorOpen}
        onClose={() => {
          setSimulatorOpen(false);
          setSimulatorTask(null);
        }}
        task={simulatorTask}
      />
    </div>
  );
}

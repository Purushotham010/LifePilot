import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchAPI } from '../lib/api';
import { Plus, Sparkles, Loader2, Calendar, Target, Clock, AlertCircle, CheckSquare, ShieldAlert, AlertTriangle, Flame, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

  const handleAiCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    setAnalyzing(true);
    try {
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
          difficulty: analyzed.difficulty || 'Medium',
          estimatedTime: analyzed.estimatedTime || 60,
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
            className="px-6 py-3 bg-bright-teal text-deep-space-violet font-medium rounded-lg disabled:opacity-50 hover:bg-bright-teal/90 transition-colors shadow-none"
          >
            {analyzing ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-deep-space-violet" /> : 'Analyze & Add'}
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
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border
                      ${task.priority === 'Critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                        task.priority === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                        'bg-rich-violet/30 text-slate-300 border border-rich-violet/60'}`}>
                      {task.priority}
                    </span>
                    
                    {/* RISK BADGE */}
                    {task.riskLevel && task.riskLevel !== 'Low' && task.status !== 'Completed' && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1
                        ${task.riskLevel === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/40 animate-pulse' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {task.riskLevel} Risk
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2">{task.description}</p>
                  
                  {/* RISK REASON */}
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
                    <div className="flex items-center gap-1.5 bg-deep-space-violet/60 px-3 py-1.5 rounded-lg border border-rich-violet/60">
                      <Clock className="w-4 h-4 text-slate-500" />
                      {task.estimatedTime}m
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

              {/* AI Plan Section & Rescue Mode */}
              <div className="mt-5 border-t border-rich-violet/60 pt-4">
                
                {/* RESCUE PLAN DISPLAY */}
                {task.rescuePlan ? (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> Emergency Rescue Plan Active
                    </h4>
                    <ul className="space-y-2">
                      {JSON.parse(task.rescuePlan).map((step: any, idx: number) => (
                        <li key={idx} className="flex items-start text-sm text-rose-100 bg-rose-950/30 px-3 py-2 rounded-lg border border-rose-500/30">
                          <span className="font-bold text-rose-400 mr-2 shrink-0">{step.timeframe}:</span>
                          <span>{step.action}</span>
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
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleBreakdown(task.id, task.description || task.title)}
                      disabled={breakingDown === task.id}
                      className="text-sm font-medium text-bright-teal hover:text-bright-teal/80 flex items-center gap-1.5 transition-colors"
                    >
                      {breakingDown === task.id ? <Loader2 className="w-4 h-4 animate-spin text-bright-teal" /> : <Sparkles className="w-4 h-4" />}
                      Break down with AI
                    </button>

                    {/* TRIGGER RESCUE PLAN BUTTON */}
                    {task.riskLevel === 'High' && task.status !== 'Completed' && (
                      <button 
                        onClick={() => handleRescuePlan(task)}
                        disabled={generatingRescue === task.id}
                        className="text-sm font-medium text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors ml-auto border border-rose-500/40 px-3 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20"
                      >
                        {generatingRescue === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                        Generate Rescue Plan
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
    </div>
  );
}

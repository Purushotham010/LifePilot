import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { 
  BrainCircuit, 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  ShieldAlert, 
  Clock, 
  Zap, 
  Users, 
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Grid Background Accents */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

      {/* Decorative Glow Elements */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[60vh] right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="font-sans font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
              LifePilot
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#showcase" className="hover:text-white transition-colors">Interactive Demo</a>
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <Link 
                to="/dashboard" 
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/25 flex items-center gap-1.5"
                id="nav-dashboard-btn"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2"
                  id="nav-login-btn"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/25 flex items-center gap-1.5"
                  id="nav-register-btn"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide mb-8"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Next-Generation Productivity: Proactive AI Assistant</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]"
        >
          The Proactive AI Companion That{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400">
            Never Lets You Miss a Deadline
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
        >
          Passive task lists are dead. Meet the smart companion that anticipates delays, builds automated action plans, and proactively guides your work.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link 
            to={user ? "/dashboard" : "/register"}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold hover:from-indigo-500 hover:to-violet-500 transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 group text-base"
            id="hero-cta-primary"
          >
            {user ? "Enter LifePilot Workspace" : "Start Achieving More"} 
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a 
            href="#showcase"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2 text-base"
            id="hero-cta-secondary"
          >
            See Guided Mode in Action
          </a>
        </motion.div>

        {/* Feature badges */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-16 flex flex-wrap justify-center items-center gap-8 text-xs text-slate-500 font-medium"
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Zero Passive Lists</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>AI Timeline Prediction</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Automatic Action Decomposition</span>
          </div>
        </motion.div>
      </section>

      {/* Interactive Assistant Showcase Section */}
      <section id="showcase" className="relative z-10 py-16 bg-slate-900/40 border-y border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Watch the Assistant Plan & Guide
            </h2>
            <p className="text-slate-400 mt-3">
              Unlike legacy todo apps, LifePilot tracks your load, analyzes difficulty, and automatically steps in when important tasks are slipping.
            </p>
          </div>

          {/* Interactive Demo Block */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Simulation Interface */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold">Timeline Needs Attention</span>
                  </div>
                  <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">PROACTIVE GUIDANCE</span>
                </div>

                <div className="space-y-4">
                  <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-base">Quarterly Product Launch Submission</h4>
                        <p className="text-xs text-slate-400 mt-1">Due: June 25th (Less than 48 hours away). Estimated focus needed: 8 hours.</p>
                      </div>
                    </div>
                  </div>

                  {/* Simulated Plan */}
                  <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800/80">
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block mb-3">AI GENERATED FOCUS PLAN</span>
                    <ul className="space-y-3">
                      <li className="flex items-start text-sm text-slate-300">
                        <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs shrink-0 mr-3 mt-0.5">✓</div>
                        <span>Complete Core Feature & API integrations (Done)</span>
                      </li>
                      <li className="flex items-start text-sm text-slate-300">
                        <div className="w-5 h-5 rounded-md bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 text-xs shrink-0 mr-3 mt-0.5">2</div>
                        <span className="font-medium text-white">Record & Edit 2-Minute Demo Video</span>
                      </li>
                      <li className="flex items-start text-sm text-slate-500">
                        <div className="w-5 h-5 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 text-xs shrink-0 mr-3 mt-0.5">3</div>
                        <span>Draft Executive Summary & Marketing Launch Copy</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Status: <strong className="text-rose-400">Needs Attention</strong></span>
                </div>
                <Link 
                  to="/register" 
                  className="px-5 py-2.5 rounded-xl bg-white text-slate-950 text-sm font-bold hover:bg-slate-200 transition-colors flex items-center gap-1"
                >
                  Activate LifePilot <Zap className="w-4 h-4 fill-slate-950" />
                </Link>
              </div>
            </div>

            {/* AI Assistant Explanation Column */}
            <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-950/80 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <BrainCircuit className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm font-bold text-white">Proactive Guidance</span>
                </div>

                <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                  <p>
                    Most task managers stay quiet when you are falling behind.
                  </p>
                  <p>
                    <strong>LifePilot is your proactive companion.</strong> It constantly monitors your load and steps in with helpful suggestions, e.g.:
                  </p>
                  <blockquote className="border-l-2 border-indigo-500 pl-3 py-1 text-slate-400 italic text-xs">
                    "I notice you haven't started your video recording task yet. Based on historic trends, recording takes average of 2.5 hours. To prevent slipping past midnight, I recommend starting Focus Mode now."
                  </blockquote>
                  <p>
                    It then automatically splits complex steps, prioritizes micro-actions, and helps you work smoothly without delay.
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Powered by Gemini 2.5 Flash for ultra-fast, structured planning.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-sans">
            Designed for Smooth Workflows
          </h2>
          <p className="text-slate-400 mt-4 text-base">
            Engineered from the ground up for builders, students, and professionals who want to stay calmly on track.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-slate-900/60 p-8 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition duration-300">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Automated Task Breakdown</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Input any vague, massive task description, and Gemini instantly breaks it down into concrete, bite-sized actionable micro-steps.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-900/60 p-8 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition duration-300">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-6">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Deadline Timeline Engine</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Calculates task density, difficulty levels, and time remaining to alert you of potential scheduling bottlenecks before they occur.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-900/60 p-8 rounded-2xl border border-slate-800 hover:border-violet-500/30 transition duration-300">
            <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400 mb-6">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Guided Chat Assistant</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Stuck? Procrastinating? Engage in a focus chat with LifePilot to reset your trajectory, find focus blocks, and eliminate blockers.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Call to Action (CTA) Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-3xl p-8 sm:p-12 text-center border border-indigo-500/20 shadow-2xl relative overflow-hidden">
          {/* Visual gradient blur */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Stop Managing Tasks. Start Finishing Them.
          </h2>
          <p className="text-indigo-200 mt-4 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Take control of your schedule with the proactive companion built for peace of mind. Get started in less than a minute.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to={user ? "/dashboard" : "/register"}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-indigo-950 font-bold hover:bg-slate-100 transition-colors shadow-lg flex items-center justify-center gap-2 text-base"
              id="cta-footer-primary"
            >
              Start Free Guided Mode <ArrowRight className="w-4 h-4 text-indigo-950" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 relative z-10 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold text-slate-400">LifePilot</span>
          </div>
          <p>© 2026 LifePilot. Proactive task guidance. Built for focus.</p>
        </div>
      </footer>
    </div>
  );
}

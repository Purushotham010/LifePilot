import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchAPI, getAuthToken } from '../../lib/api';

interface VoiceCoachProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    title: string;
    description?: string;
    deadline?: string;
    riskReason?: string;
    rescuePlan?: string;
  } | null;
}

export default function VoiceCoach({ isOpen, onClose, task }: VoiceCoachProps) {
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [conversation, setConversation] = useState<{ role: 'ai' | 'user'; text: string }[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleRecording = async () => {
    if (isListening) {
      stopListening();
    } else {
      if (isAiSpeaking || isProcessing) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        
        mediaRecorder.onstop = async () => {
          setIsListening(false);
          stream.getTracks().forEach(t => t.stop());
          
          if (audioChunksRef.current.length === 0) return;
          
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
          audioChunksRef.current = [];
          
          setIsProcessing(true);
          setTranscript('Transcribing (Gemini)...');
          
          try {
            const formData = new FormData();
            formData.append('audio', audioBlob);
            
            const sttRes = await fetch('/api/ai/stt', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${getAuthToken()}` },
              body: formData
            });
            
            if (!sttRes.ok) throw new Error('STT failed');
            const { text } = await sttRes.json();
            
            if (text && text.trim()) {
              setTranscript(text);
              setConversation(prev => [...prev, { role: 'user', text }]);
              await handleAiResponse(text);
            } else {
               setTranscript('No speech detected. Tap mic to try again.');
               setIsProcessing(false);
            }
          } catch(err) {
             console.error(err);
             setTranscript('Error understanding audio.');
             setIsProcessing(false);
          }
        };
        
        mediaRecorder.start();
        setIsListening(true);
        setTranscript('Listening... (Tap mic to stop)');
      } catch (e) {
        console.error("Microphone error", e);
        setTranscript('Microphone access denied.');
      }
    }
  };

  const speakText = async (text: string) => {
    try {
      setIsProcessing(false);
      setIsAiSpeaking(true);
      
      const response = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) throw new Error("TTS failed");
      
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        setIsAiSpeaking(false);
      };
      
      audio.onerror = () => {
        setIsAiSpeaking(false);
      }
      
      audio.play();
    } catch (e) {
      console.error("TTS Error:", e);
      setIsAiSpeaking(false);
    }
  };

  const handleAiResponse = async (userMsg: string) => {
    try {
      setIsProcessing(true);
      setAiResponse('Thinking (Gemini/Groq)...');
      
      const response = await fetchAPI('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: `The user said: "${userMsg}". We are in a real-time voice call session about the task: "${task?.title}". Context: ${task?.description || ''}. Why it needs attention: ${task?.riskReason || ''}. The focus plan is: ${task?.rescuePlan || 'none'}. Keep your answer extremely short (1-2 sentences maximum), direct, highly motivating, and voice-optimal. Prompt them with a concrete question to make them take action immediately.`,
          history: []
        })
      });

      const reply = response.text || "Let's focus on the most important step. What is it?";
      setAiResponse(reply);
      setConversation(prev => [...prev, { role: 'ai', text: reply }]);
      await speakText(reply);
    } catch (err) {
      console.error(err);
      const fallbackMsg = "I didn't catch that fully, but let's stick to our focus plan. What's holding you back?";
      setAiResponse(fallbackMsg);
      await speakText(fallbackMsg);
    }
  };

  const startCall = async () => {
    if (!task) return;
    setCallState('connecting');
    setConversation([]);
    setTranscript('');
    setAiResponse('');

    setTimeout(async () => {
      setCallState('connected');
      const introText = `Hey there. I noticed your task "${task.title}" might need some attention to stay on track. What is blocking you right now? Let's figure this out together.`;
      setAiResponse(introText);
      setConversation([{ role: 'ai', text: introText }]);
      await speakText(introText);
    }, 1500);
  };

  const endCall = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    stopListening();
    setCallState('disconnected');
    setTimeout(() => {
      onClose();
      setCallState('idle');
    }, 1000);
  };

  useEffect(() => {
    if (isOpen && task) {
      startCall();
    }
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      stopListening();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-deep-space-violet border border-rich-violet/80 w-full max-w-lg rounded-[24px] p-6 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-indigo-500 to-bright-teal animate-gradient" />
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-bright-teal/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-mono text-rose-400 uppercase tracking-widest font-semibold">Active Voice Guide</span>
            </div>
            <div className="flex items-center gap-1.5 bg-rich-violet/40 border border-rich-violet/80 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-bright-teal" />
              <span className="text-xs font-medium text-slate-300">LifePilot Companion (Gemini Powered)</span>
            </div>
          </div>

          <div className="py-10 flex flex-col items-center justify-center">
            <div className="relative mb-8">
              <motion.div 
                animate={{
                  scale: isAiSpeaking ? [1, 1.25, 1] : isListening ? [1, 1.12, 1] : 1,
                  opacity: isAiSpeaking ? [0.6, 1, 0.6] : isListening ? [0.4, 0.8, 0.4] : 0.3
                }}
                transition={{
                  repeat: Infinity,
                  duration: isAiSpeaking ? 1.2 : isListening ? 2.0 : 3.0,
                  ease: "easeInOut"
                }}
                className={`absolute inset-0 rounded-full blur-xl pointer-events-none transition-colors duration-500 ${
                  isAiSpeaking ? 'bg-bright-teal/30' : isListening ? 'bg-indigo-500/30' : 'bg-slate-500/10'
                }`}
              />
              <div className={`w-28 h-28 rounded-full border-2 flex items-center justify-center relative z-10 transition-all duration-500 ${
                isAiSpeaking ? 'border-bright-teal bg-bright-teal/10 shadow-[0_0_25px_rgba(45,212,191,0.2)]' : 
                isListening ? 'border-indigo-400 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)] animate-pulse' : 
                'border-rich-violet bg-rich-violet/20'
              }`}>
                {callState === 'connecting' || isProcessing ? (
                  <Loader2 className="w-10 h-10 text-bright-teal animate-spin" />
                ) : (
                  <Phone className={`w-10 h-10 ${isAiSpeaking ? 'text-bright-teal animate-bounce' : isListening ? 'text-indigo-400' : 'text-slate-400'}`} />
                )}
              </div>
            </div>

            <h3 className="text-2xl font-bold text-off-white mb-2 font-sans tracking-tight">
              {callState === 'connecting' ? 'Connecting to Companion...' : 
               isAiSpeaking ? 'Companion Speaking...' : 
               isListening ? 'Listening...' : 
               isProcessing ? 'Processing Audio...' :
               'Tap Mic to Speak'}
            </h3>
            
            <div className="h-20 flex flex-col items-center justify-center">
              {transcript && !isAiSpeaking && (
                <p className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-rich-violet/50 italic max-w-sm mx-auto">
                  "{transcript}"
                </p>
              )}
              {aiResponse && isAiSpeaking && (
                <p className="text-sm font-medium text-bright-teal bg-bright-teal/10 p-3 rounded-lg border border-bright-teal/30 max-w-sm mx-auto">
                  {aiResponse}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mt-4 pt-6 border-t border-rich-violet/40">
            <button 
              onClick={toggleRecording}
              disabled={callState !== 'connected' || isAiSpeaking || isProcessing}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isListening 
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)] animate-pulse' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>

            <button 
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-400 text-white flex items-center justify-center transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)]"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

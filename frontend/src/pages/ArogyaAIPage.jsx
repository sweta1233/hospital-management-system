import React, { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Bot, Send, Sparkles, User, AlertTriangle, Stethoscope,
  HeartPulse, Pill, Activity, ShieldAlert, ArrowRight,
  RefreshCw, Copy, Check, Info, HelpCircle, Thermometer,
  ShieldCheck, Brain
} from 'lucide-react'
import { getUserRoles } from '../utils/auth'

const PRESET_TOPICS = [
  {
    icon: Thermometer,
    label: 'Fever & Body Ache',
    prompt: 'I have had a high fever (101°F) and body aches for the past 2 days. What should I do and when should I see a doctor?',
    tag: 'Symptom Triage'
  },
  {
    icon: HeartPulse,
    label: 'Chest Tightness',
    prompt: 'I feel mild chest tightness and slight shortness of breath after climbing stairs. Is this an emergency?',
    tag: 'Urgent Caution'
  },
  {
    icon: Pill,
    label: 'Medicine Interactions',
    prompt: 'Can I take Paracetamol 650mg together with Amoxicillin 500mg? Are there any common side effects?',
    tag: 'Pharmacy'
  },
  {
    icon: Activity,
    label: 'High BP Guidance',
    prompt: 'My systolic blood pressure measured 145/95 mmHg today. What dietary and lifestyle adjustments help lower blood pressure?',
    tag: 'Lifestyle & Vitals'
  },
  {
    icon: Brain,
    label: 'Migraine Relief',
    prompt: 'I have a throbbing headache on one side with light sensitivity. What immediate home relief steps can I take?',
    tag: 'Neurology'
  },
]

const AI_KNOWLEDGE_BASE = [
  {
    keywords: ['chest', 'heart', 'tightness', 'shortness of breath', 'arm pain', 'pressure'],
    urgent: true,
    specialist: 'Cardiologist',
    specialistDept: 'Cardiology',
    response: `⚠️ **CLINICAL ALERT: Potential Cardiac Symptom**

Chest discomfort or tightness accompanied by shortness of breath warrants **immediate medical attention**.

**Immediate Guidance:**
1. **Stop all physical exertion** and sit down in a comfortable upright position.
2. If this is sudden, radiating to the left arm, neck, or jaw, or accompanied by cold sweats or nausea, **call emergency medical services immediately (e.g. 108 / 911)** or visit our Emergency Ward.
3. Do not drive yourself to the hospital.

**Recommended Action:**
Schedule an urgent consultation with our **Cardiology Department** for an ECG, Cardiac Enzymes (Troponin-I), and 2D Echocardiogram.`,
  },
  {
    keywords: ['fever', 'temperature', 'body ache', 'chills', 'flu', 'cough'],
    urgent: false,
    specialist: 'General Physician',
    specialistDept: 'General Medicine',
    response: `🌡️ **Clinical Assessment: Febrile Illness**

A fever of 101°F with body aches commonly indicates a viral or bacterial infection.

**Home Care & Precautions:**
• **Hydration**: Drink 2.5–3L of fluids (water, ORS, soups, coconut water).
• **Antipyretics**: Over-the-counter Paracetamol (500mg–650mg) every 6–8 hours as needed. Avoid Aspirin in young individuals.
• **Rest**: Ensure 8+ hours of restful sleep in a ventilated room.
• **Tepid Sponging**: Use room-temperature water wipes if fever exceeds 102°F.

**Red Flag Symptoms (Visit ER immediately):**
• High fever > 103°F not responding to antipyretics
• Stiff neck, extreme lethargy, or confusion
• Persistent vomiting or rash

**Recommended Next Step:**
Book an appointment with **General Medicine** if symptoms persist past 72 hours for a Complete Blood Count (CBC) and Dengue/Malaria screening.`,
  },
  {
    keywords: ['medicine', 'interaction', 'paracetamol', 'amoxicillin', 'antibiotic', 'tablet'],
    urgent: false,
    specialist: 'Clinical Pharmacist',
    specialistDept: 'Pharmacy',
    response: `💊 **Pharmacology & Drug Safety Overview**

**Paracetamol (Acetaminophen) + Amoxicillin:**
• **Drug Interaction**: There is **no known adverse clinical interaction** between Paracetamol and Amoxicillin. They are commonly co-prescribed.
• **Dosage Rule**: Take Amoxicillin after meals to minimize stomach upset. Paracetamol can be taken with or without food.
• **Complete the Course**: If you were prescribed Amoxicillin, complete the full antibiotic course even if you feel better.
• **Maximum Limit**: Do not exceed 3,000mg – 4,000mg of Paracetamol in 24 hours to prevent hepatic toxicity.

**Report to Doctor if you experience:**
• Skin rash, hives, or swelling (signs of penicillin allergy)
• Severe watery diarrhea.`,
  },
  {
    keywords: ['bp', 'blood pressure', 'hypertension', '145', 'systolic'],
    urgent: false,
    specialist: 'Internal Medicine',
    specialistDept: 'Cardiology / General Medicine',
    response: `💓 **Vitals Analysis: Stage 1 Hypertension Range**

A reading of **145/95 mmHg** indicates elevated blood pressure (Stage 1 Hypertension).

**Immediate & Daily Action Plan:**
1. **DASH Diet Principles**:
   - Limit sodium to < 2,000 mg/day (cut back on pickles, papad, processed meats, instant foods).
   - Increase potassium-rich foods (bananas, spinach, coconut water).
2. **Physical Activity**: 30 minutes of brisk walking or moderate aerobic exercise 5 days a week.
3. **Stress & Sleep**: Practice deep breathing (Pranayama) and maintain 7–8 hours of sound sleep.
4. **Log Readings**: Record BP twice daily (morning and evening) for 7 consecutive days.

**Consultation Recommended:**
Share your 7-day BP log with an **Internal Medicine specialist** or **Cardiologist** to evaluate if antihypertensive therapy or lipid profiling is necessary.`,
  },
  {
    keywords: ['headache', 'migraine', 'throbbing', 'light', 'sensitivity', 'nausea'],
    urgent: false,
    specialist: 'Neurologist',
    specialistDept: 'Neurology',
    response: `🧠 **Neurological Symptom Assessment: Migraine Indicators**

Unilateral throbbing headache with photophobia (light sensitivity) strongly aligns with migraine presentation.

**Immediate Comfort Protocol:**
• **Dark & Quiet Room**: Rest in a dark, noise-free room with eyes closed.
• **Cold / Warm Compress**: Apply a cold ice pack to your forehead or temples for 15-minute intervals.
• **Caffeine Trigger / Relief**: In early stages, a small cup of ginger tea or black coffee can help constrict dilated blood vessels.
• **Hydration**: Drink 500ml of water immediately; dehydration is a prime headache trigger.

**Warning Signs (Seek Urgent Care):**
• Sudden "thunderclap" headache reaching peak severity in seconds
• Accompanied by vision loss, weakness on one side, or speech slurring.`,
  },
]

export default function ArogyaAIPage() {
  const user = useSelector((state) => state.auth.user)
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `Namaste! I am **ArogyaAI**, your intelligent clinical assistant at Aegis Hospital.

I can help you:
• Analyze symptoms and assess severity
• Provide lifestyle, dietary & medication information
• Recommend the right hospital department or specialist
• Guide you on when to seek immediate emergency care

*How may I assist your health today?*`,
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const generateBotResponse = (userQuery) => {
    const q = userQuery.toLowerCase()

    for (const kb of AI_KNOWLEDGE_BASE) {
      if (kb.keywords.some((kw) => q.includes(kw))) {
        return {
          text: kb.response,
          urgent: kb.urgent,
          specialist: kb.specialist,
          specialistDept: kb.specialistDept,
        }
      }
    }

    // Default intelligent clinical fallback
    return {
      text: `🩺 **Clinical Observation & Health Guidance**

Thank you for sharing your health query: "*${userQuery}*".

**General Health Considerations:**
• Monitor the onset, frequency, and severity of these symptoms.
• Avoid self-medicating with antibiotics or high-dose painkillers without a formal prescription.
• Maintain optimal hydration, nutrition, and adequate rest.

**Recommended Clinical Follow-up:**
To get an accurate differential diagnosis and customized treatment plan, we recommend scheduling an in-person or video consultation with our hospital's medical team.`,
      urgent: false,
      specialist: 'General Physician',
      specialistDept: 'General Medicine',
    }
  }

  const handleSend = (textToSend = null) => {
    const query = (textToSend || input).trim()
    if (!query) return

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const responseData = generateBotResponse(query)
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: responseData.text,
        urgent: responseData.urgent,
        specialist: responseData.specialist,
        specialistDept: responseData.specialistDept,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, botMsg])
      setIsTyping(false)
    }, 900)
  }

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Session refreshed! I am **ArogyaAI**. How can I help you with your symptoms, medication questions, or medical guidance today?`,
      },
    ])
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-transparent text-slate-100 flex flex-col">
      {/* Header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Clinical Health Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center">
            Arogya<span className="text-cyan-400 font-extrabold ml-1">AI</span> Assistant
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            24/7 symptom triage, medication information, and specialist recommendation engine
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
          <button
            onClick={() => navigate('/appointments')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Book Doctor</span>
          </button>
        </div>
      </div>

      {/* Main Chat Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        {/* Left Sidebar: Quick Prompts & Disclaimers */}
        <div className="lg:col-span-1 space-y-4">
          {/* Preset Prompts */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 mr-1.5" />
              Quick Symptom Inquiries
            </h3>
            <div className="space-y-2">
              {PRESET_TOPICS.map((topic, i) => {
                const Icon = topic.icon
                return (
                  <button
                    key={i}
                    onClick={() => handleSend(topic.prompt)}
                    className="w-full p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                        {topic.tag}
                      </span>
                      <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition" />
                    </div>
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      {topic.label}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Clinical Disclaimer */}
          <div className="glass-panel rounded-2xl p-4 border border-amber-500/20 bg-amber-950/10 text-xs text-amber-300/80 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>Medical Safety Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              ArogyaAI is an assistive health triage tool powered by clinical rules. It does not replace professional emergency diagnosis. In life-threatening emergencies, please call emergency services immediately.
            </p>
          </div>
        </div>

        {/* Right Area: Interactive Chat Panel */}
        <div className="lg:col-span-3 glass-panel rounded-3xl border border-slate-800 shadow-2xl flex flex-col h-[72vh] overflow-hidden">
          {/* Chat Header Bar */}
          <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center">
                  ArogyaAI Clinical Advisor
                  <span className="ml-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h2>
                <p className="text-[11px] text-cyan-400">Aegis Healthcare Neural Knowledge Engine</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>HIPAA Compliant & Confidential</span>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot'
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`flex items-start max-w-[85%] sm:max-w-[75%] space-x-3 ${isBot ? 'flex-row' : 'flex-row-reverse space-x-reverse'}`}>
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xs ${
                        isBot
                          ? 'bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-md shadow-cyan-500/20'
                          : 'bg-gradient-to-tr from-indigo-500 to-blue-600'
                      }`}
                    >
                      {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed border ${
                        isBot
                          ? msg.urgent
                            ? 'bg-rose-950/20 border-rose-500/40 text-slate-100'
                            : 'bg-slate-900/90 border-slate-800 text-slate-200'
                          : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-500/30'
                      }`}
                    >
                      {/* Body */}
                      <div className="whitespace-pre-wrap space-y-2">
                        {msg.text.split('\n\n').map((para, pidx) => (
                          <p key={pidx} dangerouslySetInnerHTML={{
                            __html: para
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          }} />
                        ))}
                      </div>

                      {/* Specialist Referral Card inside Bot response */}
                      {isBot && msg.specialist && (
                        <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/50 p-3 rounded-xl">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-cyan-400 block">Recommended Department</span>
                            <span className="font-bold text-white text-xs">{msg.specialist} ({msg.specialistDept})</span>
                          </div>
                          <button
                            onClick={() => navigate('/appointments')}
                            className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center justify-center space-x-1 transition"
                          >
                            <span>Book Consultation</span>
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </button>
                        </div>
                      )}

                      {/* Footer time & copy button */}
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>{msg.timestamp}</span>
                        {isBot && (
                          <button
                            onClick={() => handleCopy(msg.id, msg.text)}
                            className="hover:text-cyan-400 transition flex items-center space-x-1"
                          >
                            {copiedId === msg.id ? (
                              <><Check className="w-3 h-3 text-emerald-400" /><span>Copied</span></>
                            ) : (
                              <><Copy className="w-3 h-3" /><span>Copy</span></>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-3"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex items-center space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/80">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe symptoms, ask medication advice, or health questions..."
                className="flex-1 px-4 py-3 rounded-2xl glass-input text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/20 disabled:opacity-40 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

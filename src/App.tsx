import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Bot, User, Loader2, BookOpen, Globe, MessageSquare, 
  Mic, MicOff, ThumbsUp, ThumbsDown, LogIn, LogOut, 
  Plus, History, ChevronLeft, Search, TrendingUp, 
  Package, ShoppingBag, Sparkles, Menu, X, Download,
  Volume2, VolumeX, BarChart3, Target, Megaphone, FileText, Paperclip
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { getChatResponse, AgentPersona } from './services/geminiService';
import { useFirebase } from './FirebaseProvider';
import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  serverTimestamp, doc, updateDoc, limit 
} from 'firebase/firestore';

interface Message {
  id?: string;
  role: 'user' | 'model';
  text: string;
  feedback?: 'positive' | 'negative';
  createdAt?: any;
  chartData?: any[];
  chartType?: 'bar' | 'line' | 'pie';
}

interface Session {
  id: string;
  title: string;
  updatedAt: any;
}

const QUICK_TOPICS = [
  { id: 'mitumba', label: 'Biashara ya Mitumba', icon: <Package size={16} />, prompt: 'Nipe mwongozo wa kuanza biashara ya mitumba na machimbo yake.' },
  { id: 'kariakoo', label: 'Machimbo ya Kariakoo', icon: <Search size={16} />, prompt: 'Nipe orodha ya machimbo muhimu yaliyopo Kariakoo kwa bidhaa mbalimbali.' },
  { id: 'nguo', label: 'Nguo za Ndani', icon: <ShoppingBag size={16} />, prompt: 'Wapi naweza kupata machimbo ya nguo za ndani kwa bei ya jumla?' },
  { id: 'cosmetics', label: 'Vipodozi & Urembo', icon: <Sparkles size={16} />, prompt: 'Nahitaji machimbo ya vipodozi na vifaa vya urembo.' },
  { id: 'capital', label: 'Mtaji Mdogo', icon: <TrendingUp size={16} />, prompt: 'Ni biashara gani naweza kuanza na mtaji wa chini ya laki moja?' },
];

const PERSONAS = [
  { id: 'general', label: 'General Assistant', icon: <Bot size={16} /> },
  { id: 'analyst', label: 'Business Analyst', icon: <BarChart3 size={16} /> },
  { id: 'strategy', label: 'Strategist', icon: <Target size={16} /> },
  { id: 'marketing', label: 'Marketing Expert', icon: <Megaphone size={16} /> },
];

const BUILDER_STEPS = [
  { id: 'name', question: 'Jina la biashara yako ni nani? (What is your business name?)', field: 'name' },
  { id: 'type', question: 'Unataka kufanya biashara gani? (e.g., Mitumba, Kariakoo, Cosmetics)', field: 'type' },
  { id: 'market', question: 'Walengwa wako ni nani? (Who is your target market?)', field: 'market' },
  { id: 'budget', question: 'Una mtaji kiasi gani? (What is your budget/capital?)', field: 'budget' },
  { id: 'location', question: 'Unapanga kufanyia biashara wapi? (Where do you plan to locate?)', field: 'location' },
  { id: 'staff', question: 'Je, utahitaji wafanyakazi wangapi? (How many staff members will you need?)', field: 'staff' },
];

const PROPOSAL_STEPS = [
  { id: 'company', question: 'Jina la kampuni au mradi wako? (Company or Project Name?)', field: 'company' },
  { id: 'goal', question: 'Lengo kuu la mradi huu ni nini? (What is the main goal of this project?)', field: 'goal' },
  { id: 'problem', question: 'Ni tatizo gani unalotatua? (What problem are you solving?)', field: 'problem' },
  { id: 'activities', question: 'Taja shughuli kuu za mradi huu. (List the main activities.)', field: 'activities' },
  { id: 'budget', question: 'Makadirio ya bajeti nzima? (Estimated total budget?)', field: 'budget' },
];

const TRANSLATIONS: Record<string, string> = {
  'Revenue': 'Mapato',
  'Costs': 'Gharama',
  'Profit': 'Faida',
  'Capital': 'Mtaji',
  'Marketing': 'Masoko',
  'Rent': 'Kodi',
  'Equipment': 'Vifaa',
  'Stock': 'Bidhaa',
  'Transport': 'Usafiri',
  'Misc': 'Mengineyo',
  'Total': 'Jumla',
  'Salaries': 'Mishahara',
  'Permits': 'Vibali',
  'Inventory': 'Stoo/Bidhaa',
  'Operations': 'Uendeshaji',
};

const CustomTooltip = ({ active, payload, label, total }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = payload[0].value;
    const percentage = total ? ((value / total) * 100).toFixed(1) : null;
    
    const name = data.name || label;
    const swahiliName = TRANSLATIONS[name] || null;

    return (
      <div className="bg-white p-4 rounded-2xl shadow-xl border border-[#e8e6d9] min-w-[180px]">
        <div className="mb-2 border-b border-[#f0eee4] pb-2">
          <p className="text-[#5A5A40] font-bold text-sm leading-tight">
            {swahiliName ? `${swahiliName} (${name})` : name}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Kiasi / Value</span>
            <span className="text-sm font-mono font-bold text-[#5A5A40]">
              {value.toLocaleString()}
            </span>
          </div>
          
          {percentage && (
            <div className="flex justify-between items-center gap-4">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Sehemu / Share</span>
              <span className="text-sm font-mono font-bold text-[#8A8A60]">
                {percentage}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const ChartRenderer = ({ data, type }: { data: any[], type: string }) => {
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

  return (
    <div className="w-full h-80 mt-6 bg-white rounded-[2rem] p-6 border border-[#e8e6d9] shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e6d9" vertical={false} />
            <XAxis dataKey="name" stroke="#5A5A40" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#5A5A40" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ fill: '#f8f7f2' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Bar dataKey="value" fill="#5A5A40" radius={[8, 8, 0, 0]} barSize={40} />
          </BarChart>
        ) : type === 'line' ? (
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e6d9" vertical={false} />
            <XAxis dataKey="name" stroke="#5A5A40" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#5A5A40" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Line type="monotone" dataKey="value" stroke="#5A5A40" strokeWidth={3} dot={{ r: 6, fill: '#5A5A40', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
          </LineChart>
        ) : (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={8}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#5A5A40', '#8A8A60', '#A5A58D', '#B7B7A4', '#D4D4C8'][index % 5]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip total={total} />} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default function App() {
  const { user, login, logout, loginAnonymously } = useFirebase();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [persona, setPersona] = useState<AgentPersona>('general');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  
  // Business Plan Builder State
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [builderStep, setBuilderStep] = useState(0);
  const [builderData, setBuilderData] = useState<Record<string, string>>({});

  const [isProposalMode, setIsProposalMode] = useState(false);
  const [proposalStep, setProposalStep] = useState(0);
  const [proposalData, setProposalData] = useState<Record<string, string>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  // Load user sessions
  useEffect(() => {
    if (!user) {
      setSessions([]);
      return;
    }

    const sessionsPath = `users/${user.uid}/sessions`;
    const q = query(collection(db, sessionsPath), orderBy('updatedAt', 'desc'), limit(20));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedSessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Session[];
      setSessions(loadedSessions);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, sessionsPath);
    });

    return () => unsubscribe();
  }, [user]);

  // Load messages for current session
  useEffect(() => {
    if (!user || !currentSessionId) {
      setMessages([]);
      return;
    }

    const messagesPath = `users/${user.uid}/sessions/${currentSessionId}/messages`;
    const q = query(collection(db, messagesPath), orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(loadedMessages);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, messagesPath);
    });

    return () => unsubscribe();
  }, [user, currentSessionId]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'sw-TZ'; 

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start recognition:', error);
        setIsListening(false);
      }
    }
  };

  const createNewSession = async (firstMessage: string) => {
    if (!user) return null;
    const sessionsPath = `users/${user.uid}/sessions`;
    try {
      const docRef = await addDoc(collection(db, sessionsPath), {
        title: firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '...' : ''),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, sessionsPath);
      return null;
    }
  };

  const saveMessage = async (sessionId: string, role: 'user' | 'model', text: string, chartData?: any[], chartType?: string) => {
    if (!user) return;
    const messagesPath = `users/${user.uid}/sessions/${sessionId}/messages`;
    const sessionsPath = `users/${user.uid}/sessions`;
    try {
      await addDoc(collection(db, messagesPath), {
        role,
        text,
        chartData: chartData || null,
        chartType: chartType || null,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, sessionsPath, sessionId), {
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, messagesPath);
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const messageToSend = overrideInput || input;
    if (!messageToSend.trim() || isLoading) return;

    const userMessage = messageToSend.trim();
    setInput('');

    if (isBuilderMode) {
      const currentStep = BUILDER_STEPS[builderStep];
      const newData = { ...builderData, [currentStep.field]: userMessage };
      setBuilderData(newData);

      // Add user message to UI
      setMessages(prev => [...prev, { role: 'user', text: userMessage }]);

      if (builderStep < BUILDER_STEPS.length - 1) {
        const nextStep = builderStep + 1;
        setBuilderStep(nextStep);
        setMessages(prev => [...prev, { role: 'model', text: BUILDER_STEPS[nextStep].question }]);
        if (isTtsEnabled) speak(BUILDER_STEPS[nextStep].question);
        return;
      } else {
        // Final step - Generate Plan
        setIsBuilderMode(false);
        setIsLoading(true);
        setMessages(prev => [...prev, { role: 'model', text: 'Asante! Natengeneza Mpango wa Biashara (Business Plan), Mpangilio wa Kazi (Operational Planner), na Ripoti ya Biashara (Business Report) sasa hivi... (Generating your comprehensive business package...)' }]);
        
        const prompt = `Generate a comprehensive business package for "${newData.name}". 
        Type: ${newData.type}
        Target Market: ${newData.market}
        Budget: ${newData.budget}
        Location: ${newData.location}
        Staffing: ${newData.staff} staff members
        
        The output MUST include three distinct sections:
        
        1. **MPANGO WA BIASHARA (BUSINESS PLAN)**:
           - Executive Summary
           - Market Strategy
           - Operational Plan
           
        2. **MPANGILIO WA KAZI (OPERATIONAL PLANNER)**:
           - A detailed 6-month timeline/schedule for launching and growing the business.
           - Format this as a well-organized Markdown table with columns: Month, Key Milestone, and Specific Tasks.
           
        3. **RIPOTI YA BIASHARA (BUSINESS ANALYSIS REPORT)**:
           - SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats) - Format this as a clear Markdown table with headers.
           - **Detailed Financial Projections**: Based on the ${newData.budget} budget. 
             - Break down "Costs" into specific categories: 'Salaries' (based on ${newData.staff} staff), 'Rent', 'Equipment', 'Marketing', 'Transport/Misc', and 'Permits'.
             - Include estimated revenue, costs, and profit margins. 
             - Format the financial breakdown as a Markdown table.
           - Market Trends in ${newData.location} for ${newData.type}.
        
        CRITICAL: For the Financial Projections, you MUST include a JSON chart block at the end of the report section to visualize the budget allocation (Pie Chart) or Revenue vs Costs (Bar Chart).
        Use these exact English names for categories to support bilingual tooltips: 'Revenue', 'Costs', 'Profit', 'Salaries', 'Rent', 'Equipment', 'Marketing', 'Transport', 'Permits'.
        Format Example: JSON_CHART: {"type": "pie", "data": [{"name": "Salaries", "value": 300}, {"name": "Rent", "value": 200}, {"name": "Marketing", "value": 100}]}
        
        Use the knowledge from the book "Fursa za Kibiashara na Machimbo" to provide specific advice on machimbo, strategy, and growth. Ensure the tone is professional, actionable, and all tables are perfectly organized.`;

        const response = await getChatResponse(prompt, [], 'strategy');
        
        if (isTtsEnabled) speak(response.text);

        const finalMessage: Message = {
          role: 'model',
          text: response.text,
          chartData: response.chartData,
          chartType: response.chartType
        };

        setMessages(prev => [...prev, finalMessage]);
        
        // Save to firebase if user exists
        if (user) {
          let sessionId = currentSessionId;
          if (!sessionId) {
            sessionId = await createNewSession(`Business Plan: ${newData.name}`);
            if (sessionId) setCurrentSessionId(sessionId);
          }
          if (sessionId) {
            await saveMessage(sessionId, 'user', `Business Plan Request: ${newData.name}`);
            await saveMessage(sessionId, 'model', response.text, response.chartData, response.chartType);
          }
        }
        
        setIsLoading(false);
        return;
      }
    }

    if (isProposalMode) {
      const currentStep = PROPOSAL_STEPS[proposalStep];
      const newData = { ...proposalData, [currentStep.field]: userMessage };
      setProposalData(newData);

      setMessages(prev => [...prev, { role: 'user', text: userMessage }]);

      if (proposalStep < PROPOSAL_STEPS.length - 1) {
        const nextStep = proposalStep + 1;
        setProposalStep(nextStep);
        setMessages(prev => [...prev, { role: 'model', text: PROPOSAL_STEPS[nextStep].question }]);
        if (isTtsEnabled) speak(PROPOSAL_STEPS[nextStep].question);
        return;
      } else {
        setIsProposalMode(false);
        setIsLoading(true);
        setMessages(prev => [...prev, { role: 'model', text: 'Asante! Natengeneza Business Proposal yako sasa hivi... (Generating your business proposal...)' }]);
        
        const prompt = `Generate a professional Business Proposal for "${newData.company}". 
        Goal: ${newData.goal}
        Problem: ${newData.problem}
        Activities: ${newData.activities}
        Budget: ${newData.budget}
        
        The proposal MUST include these sections:
        1. Executive Summary
        2. Introduction / Background
        3. Problem Statement
        4. Project Goals and Objectives
        5. Market Analysis (Based on Kibenje Guide principles)
        6. Strategy & Project Description
        7. Financial Plan / Budget Summary - Format this as a well-organized Markdown table.
        8. Expected Outcomes and Impact
        9. Conclusion / Call to Action
        
        CRITICAL: Include a JSON chart block to visualize the budget allocation or expected impact metrics.
        Format: JSON_CHART: {"type": "pie", "data": [{"name": "Category", "value": 100}]}
        
        Use the tone and structure of a professional grant proposal (like the Tabasamu Photo Company example). Ensure all tables are perfectly organized and the content is actionable.`;

        const response = await getChatResponse(prompt, [], 'strategy');
        
        if (isTtsEnabled) speak(response.text);

        const finalMessage: Message = {
          role: 'model',
          text: response.text,
          chartData: response.chartData,
          chartType: response.chartType
        };

        setMessages(prev => [...prev, finalMessage]);
        
        if (user) {
          let sessionId = currentSessionId;
          if (!sessionId) {
            sessionId = await createNewSession(`Proposal: ${newData.company}`);
            if (sessionId) setCurrentSessionId(sessionId);
          }
          if (sessionId) {
            await saveMessage(sessionId, 'user', `Business Proposal Request: ${newData.company}`);
            await saveMessage(sessionId, 'model', response.text, response.chartData, response.chartType);
          }
        }
        
        setIsLoading(false);
        return;
      }
    }
    
    if (!user) {
      setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
      setIsLoading(true);
      const response = await getChatResponse(userMessage, messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })), persona);
      
      if (isTtsEnabled) {
        speak(response.text);
      }

      setMessages((prev) => [...prev, { 
        role: 'model', 
        text: response.text,
        chartData: response.chartData,
        chartType: response.chartType
      }]);
      setIsLoading(false);
      return;
    }

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await createNewSession(userMessage);
      if (sessionId) setCurrentSessionId(sessionId);
    }

    if (sessionId) {
      await saveMessage(sessionId, 'user', userMessage);
      setIsLoading(true);
      
      const chatHistory = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const response = await getChatResponse(userMessage, chatHistory, persona);
      
      if (isTtsEnabled) {
        speak(response.text);
      }

      await saveMessage(sessionId, 'model', response.text, response.chartData, response.chartType);
      setIsLoading(false);
    }
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'sw-TZ'; // Try Swahili first
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const exportToPDF = async (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (!element) return;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Kibenje_Report_${messageId}.pdf`);
  };

  const handleFeedback = async (index: number, type: 'positive' | 'negative') => {
    const msg = messages[index];
    if (!msg.id || !user || !currentSessionId) {
      setMessages((prev) => prev.map((m, i) => 
        i === index ? { ...m, feedback: m.feedback === type ? undefined : type } : m
      ));
      return;
    }

    const messagePath = `users/${user.uid}/sessions/${currentSessionId}/messages/${msg.id}`;
    const newFeedback = msg.feedback === type ? null : type;
    
    try {
      await updateDoc(doc(db, messagePath), {
        feedback: newFeedback
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, messagePath);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setShowHistory(false);
    setIsMobileMenuOpen(false);
    setIsBuilderMode(false);
    setBuilderStep(0);
    setBuilderData({});
    setIsProposalMode(false);
    setProposalStep(0);
    setProposalData({});
  };

  const startBuilder = () => {
    startNewChat();
    setIsBuilderMode(true);
    setBuilderStep(0);
    setBuilderData({});
    const firstQuestion = BUILDER_STEPS[0].question;
    setMessages([{ role: 'model', text: `Karibu kwenye Kibenje Business Plan Builder! Nitakuuliza maswali machache ili kutengeneza mpango wako wa biashara.\n\n${firstQuestion}` }]);
    if (isTtsEnabled) speak(`Karibu kwenye Kibenje Business Plan Builder! ${firstQuestion}`);
  };

  const startProposalBuilder = () => {
    startNewChat();
    setIsProposalMode(true);
    setProposalStep(0);
    setProposalData({});
    const firstQuestion = PROPOSAL_STEPS[0].question;
    setMessages([{ role: 'model', text: `Karibu kwenye Kibenje Business Proposal Builder! Nitakuuliza maswali machache ili kutengeneza Business Proposal ya kitaalamu.\n\n${firstQuestion}` }]);
    if (isTtsEnabled) speak(`Karibu kwenye Kibenje Business Proposal Builder! ${firstQuestion}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        setMessages(prev => [...prev, { role: 'user', text: `Nimeambatanisha hati hii kwa ajili ya mapitio: "${file.name}"\n\n---\n${content.slice(0, 1000)}${content.length > 1000 ? '...' : ''}` }]);
        setIsLoading(true);
        
        const prompt = `Tafadhali kagua hati hii kulingana na mwongozo wa Kibenje. Toa maoni kuhusu ubora wa mpango huu, mapungufu, na mapendekezo ya kuboresha kulingana na machimbo na mikakati ya kitabu.\n\nDOCUMENT CONTENT:\n${content}`;
        
        const response = await getChatResponse(prompt, [], 'reviewer');
        
        if (isTtsEnabled) speak(response.text);
        
        const finalMessage: Message = {
          role: 'model',
          text: response.text,
          chartData: response.chartData,
          chartType: response.chartType
        };
        
        setMessages(prev => [...prev, finalMessage]);
        
        if (user) {
          let sessionId = currentSessionId;
          if (!sessionId) {
            sessionId = await createNewSession(`Review: ${file.name}`);
            if (sessionId) setCurrentSessionId(sessionId);
          }
          if (sessionId) {
            await saveMessage(sessionId, 'user', `Document Review: ${file.name}`);
            await saveMessage(sessionId, 'model', response.text, response.chartData, response.chartType);
          }
        }
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#fdfcf8] font-sans text-[#1a1a1a] flex overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-80 h-full bg-[#f8f7f2] border-r border-[#e8e6d9] flex-col shrink-0">
        <div className="p-6 border-b border-[#e8e6d9]">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#5A5A40] p-2.5 rounded-2xl text-white shadow-lg shadow-[#5A5A40]/20">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="font-serif font-bold text-xl leading-tight text-[#5A5A40]">Kibenje Guide</h1>
              <p className="text-[10px] text-[#5A5A40]/60 font-bold uppercase tracking-[0.2em]">Business Intelligence</p>
            </div>
          </div>
          
          <button 
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#5A5A40] text-white rounded-2xl hover:bg-[#4A4A30] transition-all shadow-md hover:shadow-lg font-medium mb-2"
          >
            <Plus size={18} />
            New Conversation
          </button>

          <button 
            onClick={startBuilder}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-[#5A5A40] text-[#5A5A40] rounded-2xl hover:bg-[#5A5A40] hover:text-white transition-all shadow-sm font-bold text-sm mb-2"
          >
            <Sparkles size={18} />
            Build Business Plan
          </button>

          <button 
            onClick={startProposalBuilder}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-[#5A5A40]/30 text-[#5A5A40] rounded-2xl hover:bg-[#5A5A40] hover:text-white transition-all shadow-sm font-bold text-sm"
          >
            <FileText size={18} />
            Build Proposal
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          {/* Persona Selector */}
          <div>
            <h3 className="px-4 text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-[0.2em] mb-4">AI Expert Role</h3>
            <div className="grid grid-cols-2 gap-2 px-2">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPersona(p.id as AgentPersona)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl text-[10px] font-bold transition-all border ${
                    persona === p.id 
                      ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-md' 
                      : 'bg-white text-[#5A5A40]/60 border-[#e8e6d9] hover:border-[#5A5A40]/30'
                  }`}
                >
                  {p.icon}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Topics */}
          <div>
            <h3 className="px-4 text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-[0.2em] mb-4">Quick Exploration</h3>
            <div className="space-y-1">
              {QUICK_TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleSend(topic.prompt)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[#5A5A40] hover:bg-white hover:shadow-sm transition-all text-left group"
                >
                  <span className="text-[#5A5A40]/40 group-hover:text-[#5A5A40] transition-colors">{topic.icon}</span>
                  <span className="font-medium">{topic.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* History */}
          <div>
            <h3 className="px-4 text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-[0.2em] mb-4">Recent Conversations</h3>
            <div className="space-y-1">
              {!user ? (
                <div className="px-4 py-3 text-xs text-[#5A5A40]/50 italic bg-white/50 rounded-xl">
                  Sign in to preserve your history
                </div>
              ) : sessions.length === 0 ? (
                <div className="px-4 py-3 text-xs text-[#5A5A40]/50 italic bg-white/50 rounded-xl">
                  No history yet
                </div>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setCurrentSessionId(session.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all truncate group ${
                      currentSessionId === session.id 
                        ? 'bg-white text-[#5A5A40] shadow-sm font-semibold' 
                        : 'text-[#5A5A40]/70 hover:bg-white/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare size={14} className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                      <span className="truncate">{session.title || 'Untitled Chat'}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-[#e8e6d9] bg-[#fdfcf8]/50">
          {user ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-10 h-10 rounded-2xl border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-[#5A5A40]/10 flex items-center justify-center text-[#5A5A40]">
                    <User size={20} />
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-sm font-bold truncate text-[#5A5A40]">{user.isAnonymous ? 'Guest User' : (user.displayName || 'User')}</p>
                  <p className="text-[10px] text-[#5A5A40]/50 truncate">{user.isAnonymous ? 'Anonymous Session' : user.email}</p>
                </div>
              </div>
              <button onClick={logout} className="p-2 text-[#5A5A40]/40 hover:text-red-500 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button 
                onClick={login}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#5A5A40] text-white rounded-2xl hover:bg-[#4A4A30] transition-all font-bold text-sm shadow-md"
              >
                <LogIn size={18} />
                Sign In with Google
              </button>
              <button 
                onClick={loginAnonymously}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-[#5A5A40]/10 text-[#5A5A40] rounded-2xl hover:bg-[#5A5A40]/5 transition-all font-bold text-sm"
              >
                <User size={18} />
                Continue as Guest
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-80 bg-[#f8f7f2] z-50 lg:hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-[#e8e6d9] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-[#5A5A40] p-2 rounded-xl text-white">
                    <BookOpen size={20} />
                  </div>
                  <h1 className="font-serif font-bold text-lg text-[#5A5A40]">Kibenje Guide</h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[#5A5A40]">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="space-y-2">
                  <button 
                    onClick={startNewChat}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#5A5A40] text-white rounded-xl font-medium"
                  >
                    <Plus size={18} />
                    New Chat
                  </button>
                  <button 
                    onClick={startBuilder}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-[#5A5A40] text-[#5A5A40] rounded-xl font-bold text-sm"
                  >
                    <Sparkles size={18} />
                    Build Business Plan
                  </button>
                  <button 
                    onClick={startProposalBuilder}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-[#5A5A40]/30 text-[#5A5A40] rounded-xl font-bold text-sm"
                  >
                    <FileText size={18} />
                    Build Proposal
                  </button>
                </div>
                
                <div>
                  <h3 className="px-4 text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-wider mb-3">Topics</h3>
                  <div className="space-y-1">
                    {QUICK_TOPICS.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => {
                          handleSend(topic.prompt);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[#5A5A40] hover:bg-white"
                      >
                        {topic.icon}
                        <span>{topic.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="px-4 text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-wider mb-3">History</h3>
                  <div className="space-y-1">
                    {sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => {
                          setCurrentSessionId(session.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm truncate ${
                          currentSessionId === session.id ? 'bg-white text-[#5A5A40] font-bold shadow-sm' : 'text-[#5A5A40]/70'
                        }`}
                      >
                        {session.title || 'Untitled Chat'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-[#e8e6d9]">
                {user ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#5A5A40] truncate">{user.isAnonymous ? 'Guest User' : user.displayName}</span>
                    <button onClick={logout} className="text-red-500"><LogOut size={18} /></button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button onClick={login} className="w-full py-3 bg-[#5A5A40] text-white rounded-xl font-bold">Sign In with Google</button>
                    <button onClick={loginAnonymously} className="w-full py-3 border border-[#5A5A40]/20 text-[#5A5A40] rounded-xl font-bold">Continue as Guest</button>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header */}
        <header className="bg-[#fdfcf8]/80 backdrop-blur-md border-b border-[#e8e6d9] py-4 px-6 sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-[#5A5A40]/5 rounded-xl text-[#5A5A40]"
            >
              <Menu size={24} />
            </button>
            <div className="lg:hidden bg-[#5A5A40] p-1.5 rounded-lg text-white">
              <BookOpen size={18} />
            </div>
            <div className="hidden lg:flex items-center gap-2 text-[#5A5A40]/40 text-[10px] font-bold uppercase tracking-[0.2em]">
              <Sparkles size={12} />
              <span>AI-Powered Business Intelligence</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsTtsEnabled(!isTtsEnabled)}
              className={`p-2 rounded-xl transition-all ${isTtsEnabled ? 'text-[#5A5A40] bg-[#5A5A40]/5' : 'text-[#5A5A40]/30'}`}
              title={isTtsEnabled ? "Disable Voice" : "Enable Voice"}
            >
              {isTtsEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            {isSpeaking && (
              <button 
                onClick={stopSpeaking}
                className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse"
              >
                STOP VOICE
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#5A5A40]/5 rounded-full text-[#5A5A40] text-[10px] font-bold uppercase tracking-wider">
              <Globe size={12} />
              <span>Swahili / English</span>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
          <div className="max-w-3xl mx-auto space-y-8">
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center"
              >
                <div className="mb-8 inline-flex items-center justify-center w-20 h-20 bg-[#5A5A40]/5 rounded-[2.5rem] text-[#5A5A40]">
                  <Sparkles size={40} />
                </div>
                <h2 className="text-4xl font-serif font-bold mb-4 text-[#5A5A40]">Karibu Kibenje Guide</h2>
                <p className="text-lg text-[#5A5A40]/60 max-w-lg mx-auto mb-12">
                  Your expert assistant for business opportunities, machimbo, and entrepreneurial wisdom in Tanzania.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <button
                    onClick={startBuilder}
                    className="p-8 bg-gradient-to-br from-[#5A5A40] to-[#4A4A30] text-white rounded-[2.5rem] shadow-xl shadow-[#5A5A40]/20 hover:scale-[1.02] transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                      <Sparkles size={120} />
                    </div>
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                        <Sparkles size={24} />
                      </div>
                      <h3 className="text-2xl font-serif font-bold mb-2">Plan & Report Builder</h3>
                      <p className="text-white/70 text-xs max-w-md">
                        Interactive guide to build your Business Plan, 6-Month Planner, and Analysis Report.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 bg-white border border-[#e8e6d9] rounded-[2.5rem] shadow-sm hover:border-[#5A5A40] hover:shadow-xl hover:shadow-[#5A5A40]/5 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                      <FileText size={120} />
                    </div>
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-[#f8f7f2] flex items-center justify-center text-[#5A5A40] mb-6 group-hover:bg-[#5A5A40] group-hover:text-white transition-colors">
                        <FileText size={24} />
                      </div>
                      <h3 className="text-2xl font-serif font-bold mb-2 text-[#5A5A40]">Review Doc</h3>
                      <p className="text-[#5A5A40]/50 text-xs max-w-md">
                        Upload your plan for a professional review based on the guide.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={startProposalBuilder}
                    className="md:col-span-2 p-8 bg-[#5A5A40]/5 border border-[#5A5A40]/20 rounded-[2.5rem] hover:bg-white hover:border-[#5A5A40] hover:shadow-xl transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                      <FileText size={120} />
                    </div>
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-[#5A5A40] text-white flex items-center justify-center mb-6">
                        <FileText size={24} />
                      </div>
                      <h3 className="text-2xl font-serif font-bold mb-2 text-[#5A5A40]">Business Proposal Builder</h3>
                      <p className="text-[#5A5A40]/60 text-sm max-w-md">
                        Tengeneza Business Proposal ya kitaalamu kwa ajili ya wawekezaji au wafadhili. (Executive Summary, Market Analysis, Strategy, Financial Plan)
                      </p>
                    </div>
                  </button>

                  {[
                    { title: "Machimbo ya Kariakoo", desc: "Nipe orodha ya machimbo ya Kariakoo", icon: <Search size={18} /> },
                    { title: "Biashara ya Mitumba", desc: "Nahitaji kuanza biashara ya mitumba", icon: <Package size={18} /> },
                    { title: "Mtaji Mdogo", desc: "Biashara gani naweza kuanza na 50,000?", icon: <TrendingUp size={18} /> },
                    { title: "Nguo za Ndani", desc: "Machimbo ya nguo za ndani Kariakoo", icon: <ShoppingBag size={18} /> }
                  ].map((card, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(card.desc)}
                      className="p-6 bg-white border border-[#e8e6d9] rounded-[2rem] hover:border-[#5A5A40] hover:shadow-xl hover:shadow-[#5A5A40]/5 transition-all group text-left"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-[#f8f7f2] flex items-center justify-center text-[#5A5A40] mb-4 group-hover:bg-[#5A5A40] group-hover:text-white transition-colors">
                        {card.icon}
                      </div>
                      <h3 className="font-serif font-bold text-[#5A5A40] mb-1">{card.title}</h3>
                      <p className="text-xs text-[#5A5A40]/50 italic">"{card.desc}"</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-4 max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      msg.role === 'user' ? 'bg-[#5A5A40] text-white' : 'bg-white border border-[#e8e6d9] text-[#5A5A40]'
                    }`}>
                      {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                    </div>
                    <div 
                      id={`message-${msg.id || index}`}
                      className={`relative p-5 md:p-6 rounded-[2rem] ${
                        msg.role === 'user' 
                          ? 'bg-[#5A5A40] text-white rounded-tr-none shadow-lg shadow-[#5A5A40]/10' 
                          : 'bg-white border border-[#e8e6d9] rounded-tl-none shadow-sm'
                      }`}
                    >
                      <div className={`markdown-body prose prose-sm max-w-none ${msg.role === 'user' ? 'text-white' : ''}`}>
                        <Markdown remarkPlugins={[remarkGfm]}>{msg.text}</Markdown>
                      </div>

                      {msg.role === 'model' && msg.chartData && (
                        <ChartRenderer data={msg.chartData} type={msg.chartType || 'bar'} />
                      )}
                      
                      {msg.role === 'model' && (
                        <div className="mt-6 pt-4 border-t border-[#e8e6d9]/50 flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <button 
                              onClick={() => handleFeedback(index, 'positive')}
                              className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                                msg.feedback === 'positive' ? 'text-green-600' : 'text-[#5A5A40]/30 hover:text-[#5A5A40]'
                              }`}
                            >
                              <ThumbsUp size={14} fill={msg.feedback === 'positive' ? 'currentColor' : 'none'} />
                              Helpful
                            </button>
                            <button 
                              onClick={() => handleFeedback(index, 'negative')}
                              className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                                msg.feedback === 'negative' ? 'text-red-600' : 'text-[#5A5A40]/30 hover:text-[#5A5A40]'
                              }`}
                            >
                              <ThumbsDown size={14} fill={msg.feedback === 'negative' ? 'currentColor' : 'none'} />
                              Not Helpful
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => exportToPDF(msg.id || index.toString())}
                              className="p-2 text-[#5A5A40]/30 hover:text-[#5A5A40] transition-colors"
                              title="Download as PDF"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex gap-4 items-center text-[#5A5A40]/40 text-sm ml-14">
                  <div className="flex gap-1">
                    <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1.5 h-1.5 bg-[#5A5A40]/40 rounded-full" />
                    <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#5A5A40]/40 rounded-full" />
                    <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#5A5A40]/40 rounded-full" />
                  </div>
                  <span className="font-serif italic">Assistant is analyzing the guide...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input Area */}
        <footer className="p-4 md:p-8 lg:p-10 bg-gradient-to-t from-[#fdfcf8] via-[#fdfcf8] to-transparent">
          <div className="max-w-3xl mx-auto">
            {isBuilderMode && (
              <div className="mb-4 flex items-center justify-between bg-[#5A5A40]/5 p-4 rounded-2xl border border-[#5A5A40]/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#5A5A40] text-white flex items-center justify-center text-xs font-bold">
                    {builderStep + 1}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">Step {builderStep + 1} of {BUILDER_STEPS.length}</p>
                    <p className="text-sm font-bold text-[#5A5A40]">{BUILDER_STEPS[builderStep].id.toUpperCase()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsBuilderMode(false)}
                  className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-wider"
                >
                  Cancel Builder
                </button>
              </div>
            )}

            {isProposalMode && (
              <div className="mb-4 flex items-center justify-between bg-[#5A5A40]/5 p-4 rounded-2xl border border-[#5A5A40]/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#5A5A40] text-white flex items-center justify-center text-xs font-bold">
                    {proposalStep + 1}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">Step {proposalStep + 1} of {PROPOSAL_STEPS.length}</p>
                    <p className="text-sm font-bold text-[#5A5A40]">{PROPOSAL_STEPS[proposalStep].id.toUpperCase()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsProposalMode(false)}
                  className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-wider"
                >
                  Cancel Builder
                </button>
              </div>
            )}
            <div className="relative bg-white border border-[#e8e6d9] rounded-[2.5rem] p-2 shadow-xl shadow-[#5A5A40]/5 focus-within:border-[#5A5A40] transition-all">
              <div className="flex items-end gap-2">
                <button
                  onClick={toggleListening}
                  className={`p-4 rounded-full transition-all shrink-0 ${
                    isListening ? 'bg-red-500 text-white animate-pulse' : 'text-[#5A5A40]/40 hover:bg-[#f8f7f2] hover:text-[#5A5A40]'
                  }`}
                >
                  {isListening ? <MicOff size={22} /> : <Mic size={22} />}
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 rounded-full text-[#5A5A40]/40 hover:bg-[#f8f7f2] hover:text-[#5A5A40] transition-all shrink-0"
                  title="Attach Document for Review"
                >
                  <Paperclip size={22} />
                </button>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".txt,.md,.doc,.docx"
                  onChange={handleFileUpload}
                />
                
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={isListening ? "Listening..." : "Ask your business question..."}
                  className="flex-1 bg-transparent border-none py-4 px-2 focus:ring-0 resize-none font-medium text-[#1a1a1a] placeholder:text-[#5A5A40]/30 min-h-[56px] max-h-[150px]"
                />

                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="p-4 rounded-full bg-[#5A5A40] text-white hover:bg-[#4A4A30] disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#5A5A40]/20 shrink-0"
                >
                  {isLoading ? <Loader2 size={22} className="animate-spin" /> : <Send size={22} />}
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-[#5A5A40]/30 font-bold uppercase tracking-[0.2em]">
              <span>Kelvin Kibenje Guide</span>
              <span className="w-1 h-1 bg-[#5A5A40]/20 rounded-full" />
              <span>Multilingual Support</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

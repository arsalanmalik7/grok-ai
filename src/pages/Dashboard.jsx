import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import Vosk, { createModel } from "vosk-browser";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { uploadFilesBatch, getFiles, deleteFile, generatePatientReport, getUserSessions, createSession, sendGeneralChat, getChatSession, getGeneralChatSession, getSessionInfo } from "../services/api";
import {
  MicVocal,
  Mic,
  MessageCircleMore,
  Palette,
  Folder,
  History,
  BrainCircuit,
  ImagePlus,
  AudioLines,
  Shapes,
  Binoculars,
  NotebookPen,
  HeartPulse,
  Plus,
  X,
  FileText,
  ArrowRight,
  Trash2,
  Bot,
  User,
} from "lucide-react";
import logo from "../assets/logo.png";

function VoiceWaveform({ active }) {
  const barsRef = useRef([]);

  useEffect(() => {
    let animationFrame;

    function animate() {
      if (active) {
        barsRef.current.forEach((bar) => {
          const height = Math.random() * 22 + 4; // fake levels
          bar.style.height = `${height}px`;
        });
      } else {
        barsRef.current.forEach((bar) => {
          bar.style.height = `4px`;
        });
      }
      animationFrame = requestAnimationFrame(animate);
    }

    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [active]);

  return (
    <div className="flex items-center gap-[3px] h-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          ref={(el) => (barsRef.current[i] = el)}
          className="w-[3px] bg-blue-500 rounded-sm transition-all duration-75"
          style={{ height: "4px" }}
        />
      ))}
    </div>
  );
}

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("Chat");
  const [showUpgrade, setShowUpgrade] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Hidden by default on mobile
  const [text, setText] = useState("");
  const [engine, setEngine] = useState(null);
  const [listening, setListening] = useState(false);
  const [recognizer, setRecognizer] = useState(null);
  const [loading, setLoading] = useState(false);
  const audioContextRef = useRef(null);
  const recognizerNodeRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const lastAudioTimeRef = useRef(Date.now());
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]); // Local files for preview
  const [serverFiles, setServerFiles] = useState([]); // Files confirmed uploaded to server
  const [isUploading, setIsUploading] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportFormData, setReportFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    history: "",
    complaints: "",
    context: "",
    refiner: "gemini"
  });

  const [userFiles, setUserFiles] = useState([]); // List of all user files from server
  const [subscriptionPlan, setSubscriptionPlan] = useState("Basic");

  const [historySessions, setHistorySessions] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatSessionId, setChatSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      fetchHistory();
    }
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    const sessionId = searchParams.get("sessionId");

    const loadSession = async () => {
      if (sessionId && sessionId !== chatSessionId) {
        try {
          // If we have local messages and it matches, don't reload? 
          // Actually, we should trust the URL.
          setLoading(true);
          setChatSessionId(sessionId);

          const data = await getGeneralChatSession(sessionId);
          if (data && data.session) {
            setChatMessages(data.session.messages || []);
          }
        } catch (error) {
          console.error("Failed to load session", error);
        } finally {
          setLoading(false);
        }
      } else if (!sessionId) {
        // If no session ID in URL, verify if we need to clear state
        // Only clear if we actually possess a session ID locally (to avoid clearing on initial load if empty)
        if (chatSessionId) {
          setChatSessionId(null);
          setChatMessages([]);
        }
      }
    };

    loadSession();
  }, [searchParams, chatSessionId]);


  const fetchHistory = async () => {
    try {
      const data = await getUserSessions(currentUser.uid);
      if (data && data.sessions) {
        // Fetch specific info for each session to get the topic properly
        const sessionsWithDetails = await Promise.all(data.sessions.map(async (session) => {
          try {
            // Fetch info to get metadata/topic
            const infoData = await getSessionInfo(session.session_id);
            if (infoData && infoData.session) {
              return { ...session, ...infoData.session };
            }
            return session;
          } catch (err) {
            console.error(`Failed to fetch info for session ${session.session_id}`, err);
            return session;
          }
        }));

        // Sort by created_at desc if available, or keep order
        sessionsWithDetails.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setHistorySessions(sessionsWithDetails);
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };

  useEffect(() => {
    if (currentUser) {

      const unsubscribe = onSnapshot(doc(db, "users", currentUser.uid), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data.subscription?.plan) {
            setSubscriptionPlan(data.subscription.plan);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);

    // If image → show preview
    if (selected.type.startsWith("image/")) {
      const url = URL.createObjectURL(selected);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    fileInputRef.current.value = "";
  };

  const fetchUserFiles = async () => {
    try {
      console.log(currentUser.uid);
      const response = await getFiles({ userId: currentUser.uid, limit: 50 });
      // Assuming response is the list or has a property for list
      setUserFiles(Array.isArray(response) ? response : response.files || []);
      setShowFilesModal(true);
    } catch (error) {
      console.error("Failed to fetch files", error);
    }
  };

  const SILENCE_LIMIT = 5000; // 5 seconds

  const startSTT = async () => {
    try {
      if (!recognizerNodeRef.current) {
        setLoading(true); // start loading
        console.log("Loading Vosk model...");

        const model = await createModel("/model/vosk-model-small.zip");
        const rec = new model.KaldiRecognizer(16000);

        rec.on("result", (message) => {
          if (message?.result?.text) {
            setText((t) => t + " " + message.result.text);
          }
        });

        rec.on("partialresult", (message) => {
          if (message?.result?.partial) {
            lastAudioTimeRef.current = Date.now(); // update last audio time
          }
        });

        setRecognizer(rec);

        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000,
          },
        });

        audioContextRef.current = new AudioContext({ sampleRate: 16000 });
        recognizerNodeRef.current =
          audioContextRef.current.createScriptProcessor(4096, 1, 1);

        recognizerNodeRef.current.onaudioprocess = (event) => {
          try {
            rec.acceptWaveform(event.inputBuffer);
            lastAudioTimeRef.current = Date.now(); // update on every audio chunk
          } catch (err) {
            console.error("acceptWaveform error:", err);
          }
        };

        const source = audioContextRef.current.createMediaStreamSource(
          mediaStreamRef.current
        );
        source.connect(recognizerNodeRef.current);
        recognizerNodeRef.current.connect(audioContextRef.current.destination);
      }

      setListening(true);

      // Start monitoring silence
      silenceTimeoutRef.current = setInterval(() => {
        if (Date.now() - lastAudioTimeRef.current > SILENCE_LIMIT) {
          stopSTT();
        }
      }, 1000);
    } catch (err) {
      console.error("STT Start Error:", err);
    } finally {
      setLoading(false); // stop loading
    }
  };

  const stopSTT = async () => {
    try {
      setListening(false);

      if (recognizerNodeRef.current) {
        recognizerNodeRef.current.disconnect();
        recognizerNodeRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }

      // Clear silence monitoring
      if (silenceTimeoutRef.current) {
        clearInterval(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }

      console.log("STT stopped due to inactivity or user action");
    } catch (err) {
      console.error("STT Stop Error:", err);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true); // Show on desktop
      } else {
        setSidebarOpen(false); // Hide on mobile
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (window.innerWidth < 1024 && sidebarOpen) {
        const sidebar = document.querySelector("aside");
        const menuButton = document.querySelector("[data-menu-button]");
        if (
          sidebar &&
          !sidebar.contains(e.target) &&
          !menuButton?.contains(e.target)
        ) {
          setSidebarOpen(false);
        }
      }
    };

    if (sidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [sidebarOpen]);

  const handleSendMessage = async () => {
    if (!text.trim() && uploadedFiles.length === 0) return;

    console.log("Generating report...", uploadedFiles);
    if (uploadedFiles.length > 0) {
      setShowReportModal(true);
    } else {
      // General Chat
      try {
        setLoading(true);
        const userMsg = { role: 'user', content: text };
        setChatMessages(prev => [...prev, userMsg]);

        const currentText = text;
        setText("");

        // Ensure we have a session id before sending. If none, create one and persist it locally and in the URL.
        let sessionIdToUse = chatSessionId;
        if (!sessionIdToUse) {
          try {
            const sessResp = await createSession(currentUser?.uid);
            const newSessionId = sessResp?.session_id || sessResp?.id || sessResp?.sessionId || sessResp;
            if (newSessionId) {
              sessionIdToUse = newSessionId;
              setChatSessionId(newSessionId);
              setSearchParams({ sessionId: newSessionId });
            }
          } catch (err) {
            console.error('Failed to create session', err);
          }
        }

        const response = await sendGeneralChat(currentText, sessionIdToUse, 'gemini');

        if (response.session_id) {
          setChatSessionId(response.session_id);
          setSearchParams({ sessionId: response.session_id });
        }

        const botContent = response.response || response.message || response.content;
        const botMsg = { role: 'assistant', content: botContent };
        setChatMessages(prev => [...prev, botMsg]);
      } catch (error) {
        console.error("Failed to start chat", error);
        // Optional: Add error message to chat
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);

      const formData = new FormData();

      // Append files
      uploadedFiles.forEach(file => {
        formData.append('files', file);
      });

      // Append patient info
      formData.append('patient_name', reportFormData.name);
      formData.append('patient_age', reportFormData.age);
      formData.append('patient_gender', reportFormData.gender);
      formData.append('chief_complaint', reportFormData.complaints);

      // Add context if needed, though endpoint description mainly lists above
      if (reportFormData.context || text) {
        formData.append('patient_context', reportFormData.context || text);
      }

      if (currentUser?.uid) {
        formData.append('user_id', currentUser.uid);
      }

      const response = await generatePatientReport(formData);
      const reportId = response.report_id || response.id || response._id;

      // Clear state
      setServerFiles([]);
      setUploadedFiles([]);
      setText("");
      setReportFormData({
        name: "",
        age: "",
        gender: "Male",
        history: "",
        complaints: "",
        context: "",
        refiner: "gemini"
      });
      setShowReportModal(false);

      if (reportId) {
        navigate(`/reports/${reportId}`);
      } else {
        navigate("/reports");
      }
    } catch (error) {
      console.error("Failed to generate report", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  const menuItems = [
    { id: "Chat", icon: <MessageCircleMore />, label: "Chat" },
    { id: "Reports", icon: <FileText />, label: "Reports" },
    // { id: "Voice", icon: <AudioLines />, label: "Voice" },
    // { id: "Imagine", icon: <Palette />, label: "Imagine" },
    // { id: "Projects", icon: <Folder />, label: "Projects" },
    // { id: "History", icon: <History />, label: "History" },
  ];

  const historyItems = {
    // May: [
    //   'Supernatural Encounters in',
    //   'Rainy Night Horror Tale',
    //   'Real Horror at Villisca Axe',
    // ],
    // March: [
    //   'Tech Stacks Image Creation',
    // ],
  };

  return (
    <div className="min-h-screen bg-white flex relative">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out flex flex-col shadow-lg lg:shadow-none`}
      >
        <div className="p-3 sm:p-4 overflow-y-auto flex-1">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <img
                src={logo}
                className="w-10 h-10 sm:w-18 sm:h-18"
                alt="logo"
              />
              <div className="text-xl sm:text-2xl font-bold">MagnaAI</div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 p-1 -mr-1"
              aria-label="Close menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search Ctrl+K"
              className="w-full px-3 py-2 pl-8 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            <svg
              className="absolute left-2.5 top-2.5 w-3 h-3 sm:w-4 sm:h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "Reports") {
                    navigate("/reports");
                    return;
                  }
                  setActiveTab(item.id);
                  if (item.id === "Chat") {
                    setSearchParams({});
                  }
                  // Close sidebar on mobile after selection
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg text-left transition text-sm sm:text-base ${activeTab === item.id
                  ? "bg-gray-100 text-black font-medium"
                  : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto w-2 h-2 bg-blue-500 rounded-full shrink-0"></span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-4 sm:mt-6">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2 px-3">
              History
            </div>
            {historySessions.length > 0 ? (
              <div className="mb-3 sm:mb-4">
                {historySessions.slice(0, 10).map((session, idx) => (
                  <button
                    key={session.session_id}
                    onClick={async () => {
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }

                      if (session.type === 'report_chat') {
                        // Need report ID. If not in session list, fetch session info.
                        // Assuming session list might NOT have report_id based on example.
                        try {
                          setLoading(true); // maybe show a global loader? Dashboard has local loading state.
                          const sessionData = await getChatSession(session.session_id, currentUser.uid);
                          if (sessionData && sessionData.session && sessionData.session.report_id) {
                            navigate(`/reports/${sessionData.session.report_id}`);
                          } else {
                            console.error("Could not find report ID for session");
                          }
                        } catch (e) {
                          console.error("Error navigating to report chat", e);
                        } finally {
                          setLoading(false);
                        }
                      } else {
                        // navigate(`/chat/${session.session_id}`);
                        navigate(`/dashboard?sessionId=${session.session_id}`);
                      }
                    }}
                    className="w-full text-left cursor-pointer px-3 py-1.5 text-xs sm:text-sm text-gray-600 hover:bg-gray-50 rounded truncate flex items-center gap-2"
                  >
                    <MessageCircleMore className="w-3 h-3 shrink-0" />
                    <span className="truncate">{session.metadata?.topic || session.topic || session.type}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-2 text-xs sm:text-sm text-gray-400">
                No recent chats
              </div>
            )}
            {historySessions.length > 0 && (
              <button
                onClick={() => {
                  // Navigate to a full history page if exists? For now just close sidebar
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className="w-full text-left cursor-pointer px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:bg-gray-50 rounded hidden"
              >
                See all
              </button>
            )}
          </div>
        </div>

        <div className="mt-auto p-3 sm:p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center shrink-0 text-xs sm:text-sm font-medium">
              {currentUser?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                {currentUser?.email || "User"}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-xs cursor-pointer sm:text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
          >
            Sign out
          </button>
        </div>

        <div className="bg-gray-900 text-white p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="font-semibold mb-1 text-sm sm:text-base">
              {subscriptionPlan}
            </div>
            <div className="text-xs sm:text-sm text-gray-300">
              {subscriptionPlan === "Basic" ? "Upgrade to unlock more" : "Active Subscription"}
            </div>
          </div>
          {subscriptionPlan === "Basic" && (
            <button
              onClick={() => navigate("/pricing")}
              className="w-full cursor-pointer sm:w-auto px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 text-sm sm:text-base whitespace-nowrap"
            >
              Upgrade
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-30">
          <button
            data-menu-button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700 p-2 -ml-2"
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <img src={logo} className="w-10 h-10 sm:w-18 sm:h-18" alt="logo" />
            <div className="text-lg sm:text-xl font-bold">MagnaAI</div>
          </div>
          <div className="w-10"></div>
        </header>

        {/* Main Area */}
        <main className={`flex-1 flex flex-col items-center ${chatMessages.length > 0 ? 'justify-end' : 'justify-center'} px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 overflow-hidden`}>
          <div className={`w-full max-w-4xl flex flex-col ${chatMessages.length > 0 ? 'h-full' : ''}`}>
            {chatMessages.length === 0 && (
              <div className="text-center mb-6 sm:mb-8">
                <div className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 flex items-center justify-center gap-2 flex-wrap">
                  <img
                    src={logo}
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24"
                    alt="logo"
                  />
                  <span className="whitespace-nowrap">MagnaAI</span>
                </div>
              </div>
            )}

            {chatMessages.length > 0 && (
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-200'}`}>
                        {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-gray-700" />}
                      </div>
                      <div
                        className={`
                                rounded-2xl px-5 py-3.5 text-sm leading-relaxed
                                ${msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                          }
                            `}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-end gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                        <Bot className="w-5 h-5 text-gray-700" />
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef}></div>
              </div>
            )}

            <div className="mb-6 sm:mb-8">
              <div className="flex items-end gap-2 bg-gray-50 rounded-4xl px-4 sm:px-6 py-3 shadow-sm border border-gray-200">

                {/* <div className="relative group inline-block shrink-0 self-end"> */}
                <button
                  onClick={fetchUserFiles}
                  className="hover:bg-gray-300 cursor-pointer rounded-full p-2 text-gray-600"
                  title="My Files"
                >
                  <Folder className="w-5 h-5" />
                </button>
                <label className="hover:bg-gray-300 cursor-pointer rounded-full p-2">
                  <Plus className="w-5 h-5" />
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      if (files.length === 0) return;

                      // Just update local files for preview and eventual submission
                      setUploadedFiles((prev) => [...prev, ...files]);

                      // Clear input so same files can be selected again if needed
                      e.target.value = '';
                    }}
                  />
                </label>

                {/* <div
                    className="
                      absolute left-1/2 -translate-x-1/2 -top-8 
                      opacity-0 group-hover:opacity-100 
                      transition px-2 py-1 text-xs
                      bg-gray-700 text-white rounded shadow
                      whitespace-nowrap
                    "
                  >
                    Add file(s)
                  </div> */}
                {/* </div> */}

                {/* -------- FILE PREVIEW LIST (UP TO 5) -------- */}
                {uploadedFiles.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap max-w-[40%] self-end">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-white border border-gray-300 px-2 py-1 rounded-full"
                      >
                        {file.type.startsWith("image/") ? (
                          <img
                            src={URL.createObjectURL(file)}
                            className="w-8 h-8 object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full text-xs">
                            {file.name.split(".").pop().toUpperCase()}
                          </div>
                        )}

                        <span className="text-sm max-w-20 truncate">
                          {file.name}
                        </span>

                        <button
                          className="text-gray-500 hover:text-red-500"
                          onClick={() => {
                            setUploadedFiles((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                          }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* -------- TEXTAREA (ALWAYS PUSHES UP, NOT SIDES) -------- */}
                <div className="flex-1 flex items-end">
                  <textarea
                    value={text}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    onChange={(e) => {
                      setText(e.target.value);
                      const el = e.target;
                      el.style.height = "24px";
                      el.style.height =
                        Math.min(el.scrollHeight, 8 * 24) + "px";
                    }}
                    placeholder="What do you want to know?"
                    className="
                      w-full
                      bg-transparent
                      outline-none
                      text-gray-700
                      placeholder-gray-400
                      text-sm sm:text-base
                      resize-none
                      leading-6
                      mb-0.5
                      scrollbar-thin
                      scrollbar-thumb-gray-300
                      scrollbar-track-gray-100
                    "
                    style={{
                      height: "24px",
                      maxHeight: `${8 * 24}px`,
                    }}
                  />
                </div>

                {/* -------- VOICE BUTTON -------- */}
                {/* -------- VOICE BUTTON & SEND BUTTON -------- */}
                <div className="flex items-center gap-2 self-end mb-0.5">
                  <button
                    onClick={listening ? stopSTT : startSTT}
                    className="shrink-0 p-2 cursor-pointer hover:bg-gray-300 rounded-full text-gray-600 hover:text-gray-800"
                    aria-label={listening ? "Stop listening" : "Start voice input"}
                  >
                    {loading ? (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : listening ? (
                      <VoiceWaveform active={listening} />
                    ) : (
                      <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </button>

                  <button
                    onClick={handleSendMessage}
                    disabled={!text.trim() && uploadedFiles.length === 0}
                    className={`shrink-0 p-2 rounded-full transition-colors ${(!text.trim() && uploadedFiles.length === 0)
                      ? "text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                      }`}
                  >
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:flex lg:flex-row lg:justify-center">
              {/* <div className="flex gap-2 py-2 px-4 items-center border-gray-200 border rounded-full cursor-pointer hover:bg-gray-50">
                <BrainCircuit /> <p>Deep search</p>
              </div>

              <div className="flex gap-2 py-2 px-4 items-center border-gray-200 border rounded-full cursor-pointer hover:bg-gray-50">
                <ImagePlus /> <p>Create Image</p>
              </div>

              <div className="flex gap-2 py-2 px-4 items-center border-gray-200 border rounded-full cursor-pointer hover:bg-gray-50">
                <Folder /> <p>Create Personas</p>
              </div>

              <div className="flex gap-2 py-2 px-4 items-center border-gray-200 border rounded-full cursor-pointer hover:bg-gray-50">
                <AudioLines /> <p>Voice</p>
              </div> */}

              <div className="flex gap-2 py-2 px-4 items-center border-gray-200 border rounded-full cursor-pointer hover:bg-gray-50">
                <HeartPulse /> <p>Medical Diagnosis</p>
              </div>
              <div className="flex gap-2 py-2 px-4 items-center border-gray-200 border rounded-full cursor-pointer hover:bg-gray-50">
                <Shapes /> <p>Medical Classification</p>
              </div>
              <div className="flex gap-2 py-2 px-4 items-center border-gray-200 border rounded-full cursor-pointer hover:bg-gray-50">
                <Binoculars /> <p>Medical Research</p>
              </div>
              <div className="flex gap-2 py-2 px-4 items-center border-gray-200 border rounded-full cursor-pointer hover:bg-gray-50">
                <NotebookPen /> <p>Student Assistance</p>
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* Files Modal */}
      {showFilesModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">My Files</h3>
              <button
                onClick={() => setShowFilesModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {userFiles.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Folder className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No files uploaded yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {userFiles.map((file, idx) => (
                    <div key={file.file_id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">{file.filename}</div>
                          <div className="text-xs text-gray-500 flex gap-2">
                            <span>{(file.file_size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span>{new Date(file.created_at || Date.now()).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this file?')) {
                            try {
                              await deleteFile(file.file_id || file.id);
                              setUserFiles(prev => prev.filter(f => (f.file_id || f.id) !== (file.file_id || file.id)));
                            } catch (error) {
                              console.error("Failed to delete file", error);
                              alert("Failed to delete file");
                            }
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition"
                        title="Delete file"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
              <button
                onClick={() => setShowFilesModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Report Generation Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Generate Medical Report</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={reportFormData.name}
                    onChange={(e) => setReportFormData({ ...reportFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={reportFormData.age}
                    onChange={(e) => setReportFormData({ ...reportFormData, age: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="45"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={reportFormData.gender}
                  onChange={(e) => setReportFormData({ ...reportFormData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaints (comma separated)</label>
                <input
                  type="text"
                  value={reportFormData.complaints}
                  onChange={(e) => setReportFormData({ ...reportFormData, complaints: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Fever, Nausea, Headache"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
                <textarea
                  value={reportFormData.history}
                  onChange={(e) => setReportFormData({ ...reportFormData, history: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20"
                  placeholder="Diabetes, Hypertension..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Context</label>
                <textarea
                  value={reportFormData.context}
                  onChange={(e) => setReportFormData({ ...reportFormData, context: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20"
                  placeholder="Patient was observed..."
                  defaultValue={text}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AI Model Refiner</label>
                <select
                  value={reportFormData.refiner}
                  onChange={(e) => setReportFormData({ ...reportFormData, refiner: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="gemini">Gemini (Recommended)</option>
                  <option value="gpt4o">GPT-4o</option>
                  <option value="none">None (Faster)</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
              >
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

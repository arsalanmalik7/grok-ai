import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getReport,
  getReportChats,
  sendChatMessage,
  startReportChat,
  getChatSession,
} from "../services/api";
import {
  ArrowLeft,
  Send,
  User,
  Bot,
  Loader2,
  Download,
  FileText,
  FileJson,
  File,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import axios from "axios";
import axiosInstance from "../services/axiosInstance";

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (currentUser) {
      fetchReportAndChat();
    }
  }, [id, currentUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchReportAndChat = async () => {
    try {
      const [reportData, chatsData] = await Promise.all([
        getReport(id),
        getReportChats(id, currentUser?.uid),
      ]);
      setReport(reportData);

      // Setup chat session
      if (chatsData && chatsData.chats && chatsData.chats.length > 0) {
        // Resume last session
        const lastSession = chatsData.chats[chatsData.chats.length - 1];
        setSessionId(lastSession.session_id);
        // We might need to fetch full history here if chatsData only has summary
        // But let's assume for now we perform a separate fetch if needed,
        // or if the list didn't include messages. The prompt said GET /report/chat/{session_id} gets history.
        // So let's fetch history.
        const history = await getChatSession(
          lastSession.session_id,
          currentUser?.uid
        );
        if (history && history.session && history.session.messages) {
          setMessages(history.session.messages);
        }
      } else {
        // Do not auto-start session. Wait for user input.
        setSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching report details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      let response;
      if (!sessionId) {
        // Start new chat with this question
        response = await startReportChat(id, currentUser?.uid, userMsg.content);
        if (response.session_id) {
          setSessionId(response.session_id);
        }
      } else {
        // Continue existing chat
        response = await sendChatMessage(
          sessionId,
          userMsg.content,
          currentUser?.uid
        );
      }

      // content might be in response.response (start) or response.response (message)
      // Based on prompt:
      // Start: { response: "..." }
      // Continue: { response: "..." }
      const botContent =
        response.response || response.message || response.content;

      const botMsg = { role: "assistant", content: botContent };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Optional: Add error message to chat
    } finally {
      setSending(false);
    }
  };

  const downloadFile = async (url, filename) => {
    try {
      const token = localStorage.getItem("accessToken");

      const response = await axios.get(
        import.meta.env.VITE_API_FILE_BASE_URL + url,
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const blob = new Blob([response.data]);
      const link = document.createElement("a");

      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download file");
    }
  };

  const DownloadButton = ({ onClick, label, Icon }) => (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-sm transition"
    >
      <Icon className="w-4 h-4 text-blue-600" />
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Report not found</h2>
        <button
          onClick={() => navigate("/reports")}
          className="text-blue-600 hover:underline"
        >
          Back to Reports
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Report Content - Left Panel */}
      <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-200 bg-white">
        <button
          onClick={() => navigate("/reports")}
          className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Reports
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {report.title || "Medical Report"}
        </h1>
        <div className="text-sm text-gray-500 mb-6">
          Generated on {new Date().toLocaleDateString()}
        </div>

        {/* Download Section */}
        {report?.report?.download_links && (
          <div className="flex flex-wrap gap-3 mb-6">
            <DownloadButton
              label="PDF"
              Icon={FileText}
              onClick={() =>
                downloadFile(
                  report?.report?.download_links?.pdf,
                  "medical-report.pdf"
                )
              }
            />

            <DownloadButton
              label="Word (DOCX)"
              Icon={File}
              onClick={() =>
                downloadFile(
                  report?.report?.download_links?.docx,
                  "medical-report.docx"
                )
              }
            />

            <DownloadButton
              label="JSON"
              Icon={FileJson}
              onClick={() =>
                downloadFile(
                  report?.report?.download_links?.json,
                  "medical-report.json"
                )
              }
            />
          </div>
        )}

        <div className="prose max-w-none">
          {/* Render report content. If it's markdown, we'd need a parser. Using pre-wrap for now */}
          <div className="prose prose-purple max-w-none text-gray-800">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {report?.report?.executive_summary || report?.executive_summary}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Chat Interface - Right Panel */}
      <div className="w-1/2 flex flex-col bg-gray-50">
        <div className="p-4 bg-white border-b border-gray-200 shadow-sm">
          <h2 className="font-semibold text-gray-800">
            Chat about this Report
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              <Bot className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>Ask anything about this report.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`
                    max-w-[80%] rounded-2xl px-4 py-3 text-sm
                    ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                    }
                  `}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-gray-200 rounded-full px-4 py-2 animate-pulse">
                <span className="w-2 h-2 bg-gray-400 rounded-full inline-block mr-1"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full inline-block mr-1"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full inline-block"></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef}></div>
        </div>

        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 border border-transparent focus-within:border-blue-500 focus-within:bg-white transition">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask a follow-up question..."
              className="flex-1 bg-transparent outline-none text-sm"
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className={`p-2 rounded-full ${
                input.trim()
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 text-gray-500"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;

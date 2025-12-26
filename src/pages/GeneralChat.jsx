import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGeneralChatSession, createSession, sendGeneralChat } from '../services/api';
import { ArrowLeft, Send, Bot, Loader2, MessageSquare } from 'lucide-react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const GeneralChat = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [topic, setTopic] = useState("General Chat");
    const chatEndRef = useRef(null);

    useEffect(() => {
        fetchChatSession();
    }, [sessionId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchChatSession = async () => {
        if (!sessionId) {
            setLoading(false);
            return;
        }

        try {
            const data = await getGeneralChatSession(sessionId);
            if (data && data.session) {
                setMessages(data.session.messages || []);
                if (data.session.metadata?.topic) {
                    setTopic(data.session.metadata.topic);
                }
            }
        } catch (error) {
            console.error('Error fetching chat session:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSending(true);

        try {
            // If we don't have a sessionId from the URL, create one and update the URL so future messages use it
            let sid = sessionId;
            if (!sid) {
                try {
                    const sessResp = await createSession();
                    const newId = sessResp?.session_id || sessResp?.id || sessResp?.sessionId || sessResp;
                    if (newId) {
                        sid = newId;
                        navigate(`/chat/${newId}`);
                    }
                } catch (err) {
                    console.error('Failed to create session:', err);
                }
            }

            const response = await sendGeneralChat(userMsg.content, sid, 'gemini');

            const botContent = response.response || response.message || response.content;
            const botMsg = { role: 'assistant', content: botContent };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <div className="w-full max-w-4xl mx-auto flex flex-col bg-white shadow-xl h-full sm:h-[95%] sm:mt-[2.5%] sm:rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center gap-4 bg-white z-10">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-semibold text-gray-800 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-500" />
                            {topic}
                        </h1>
                        <p className="text-xs text-gray-500">Medical AI Assistant</p>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Bot className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">How can I help you today?</p>
                            <p className="text-sm">Ask any medical question.</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`
                                        max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed
                                        ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                                        }
                                    `}
                                >
                                    {msg.role === 'assistant' ? (
                                        // <ReactMarkdown
                                        //     remarkPlugins={[remarkGfm]}
                                        //     className="prose prose-sm max-w-none prose-blue dark:prose-invert"
                                        // >
                                        // </ReactMarkdown>
                                        <div>{msg.content}</div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {sending && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef}></div>
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-200">
                    <div className="max-w-4xl mx-auto flex items-center gap-2 bg-gray-100 rounded-full px-2 py-2 border border-transparent focus-within:border-blue-500 focus-within:bg-white focus-within:shadow-md transition-all">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type your health question..."
                            className="flex-1 bg-transparent border-none outline-none text-base px-4 text-gray-800 placeholder-gray-500"
                            disabled={sending}
                            autoFocus
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || sending}
                            className={`p-3 rounded-full transition-all ${input.trim()
                                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:scale-105 active:scale-95'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneralChat;

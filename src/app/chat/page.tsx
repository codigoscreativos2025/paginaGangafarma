'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type Message = {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
};

type Order = {
    id: string;
    total: number;
    status: { name: string; color: string } | null;
    createdAt: string;
    items: string;
};

export default function ChatPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [conversations, setConversations] = useState<{id: string; updatedAt: string}[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (session) {
            fetchConversations();
            fetchOrders();
        }
    }, [session]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const res = await fetch('/api/chat');
            const data = await res.json();
            if (data.conversations) {
                setConversations(data.conversations);
                if (data.conversations.length > 0 && !currentConversationId) {
                    loadConversation(data.conversations[0].id);
                }
            }
        } catch (e) {
            console.error('Error fetching conversations:', e);
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/order');
            const data = await res.json();
            if (data.orders) {
                setOrders(data.orders.slice(0, 10));
            }
        } catch (e) {
            console.error('Error fetching orders:', e);
        }
    };

    const loadConversation = async (id: string) => {
        setCurrentConversationId(id);
        const conv = conversations.find(c => c.id === id);
        if (conv) {
            try {
                const res = await fetch(`/api/chat?conversationId=${id}`);
                const data = await res.json();
                if (data.messages) {
                    setMessages(data.messages);
                }
            } catch (e) {
                console.error('Error loading conversation:', e);
            }
        }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;
        
        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: input,
                    conversationId: currentConversationId
                })
            });
            const data = await res.json();
            
            if (data.response) {
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: data.response,
                    timestamp: new Date().toISOString()
                };
                setMessages(prev => [...prev, assistantMessage]);
                
                if (!currentConversationId && data.conversationId) {
                    setCurrentConversationId(data.conversationId);
                    fetchConversations();
                }
            }
        } catch (e) {
            console.error('Error sending message:', e);
        } finally {
            setLoading(false);
        }
    };

    const startNewConversation = async () => {
        setCurrentConversationId(null);
        setMessages([]);
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <span className="material-symbols-outlined text-6xl text-primary animate-spin">refresh</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <aside className="w-80 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-200">
                    <button
                        onClick={startNewConversation}
                        className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">chat</span>
                        Nueva Conversación
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="p-4">
                        <h3 className="text-sm font-bold text-slate-500 mb-3">MIS COMPRAS</h3>
                        <div className="space-y-2">
                            {orders.map((order) => (
                                <button
                                    key={order.id}
                                    className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-primary/50 transition-colors"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-slate-800">#{order.id.slice(-8)}</span>
                                        {order.status && (
                                            <span 
                                                className="px-2 py-0.5 rounded text-xs font-medium text-white"
                                                style={{ backgroundColor: order.status.color }}
                                            >
                                                {order.status.name}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        ${order.total.toFixed(2)} - {new Date(order.createdAt).toLocaleDateString()}
                                    </p>
                                </button>
                            ))}
                            {orders.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-4">No hay compras</p>
                            )}
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-200">
                        <h3 className="text-sm font-bold text-slate-500 mb-3">CONVERSACIONES</h3>
                        <div className="space-y-2">
                            {conversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => loadConversation(conv.id)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                                        currentConversationId === conv.id 
                                            ? 'bg-primary/10 border border-primary/30' 
                                            : 'border border-slate-200 hover:border-primary/50'
                                    }`}
                                >
                                    <p className="font-medium text-slate-800 text-sm truncate">Chat con Remedina</p>
                                    <p className="text-xs text-slate-400">
                                        {new Date(conv.updatedAt).toLocaleDateString()}
                                    </p>
                                </button>
                            ))}
                            {conversations.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-4">Inicia una conversación</p>
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col">
                <header className="bg-white border-b border-slate-200 p-4">
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">smart_toy</span>
                        Remedina - Asistente Virtual
                    </h1>
                    <p className="text-sm text-slate-500">Puedo ayudarte con tus pedidos y consultas</p>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-10">
                            <span className="material-symbols-outlined text-6xl text-slate-300">smart_toy</span>
                            <p className="mt-4 text-slate-500">¡Hola! Soy Remedina, tu asistente virtual. ¿En qué puedo ayudarte?</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] p-4 rounded-2xl ${
                                    msg.role === 'user' 
                                        ? 'bg-primary text-white rounded-br-md' 
                                        : msg.role === 'system'
                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                            : 'bg-white border border-slate-200 rounded-bl-md'
                                }`}>
                                    <p className="whitespace-pre-line">{msg.content}</p>
                                    <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-white/70' : 'text-slate-400'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-md">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-slate-200">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage()}
                            placeholder="Escribe tu mensaje..."
                            disabled={loading}
                            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            className="bg-primary text-white px-6 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined">send</span>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

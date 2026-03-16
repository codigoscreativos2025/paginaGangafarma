'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Message = {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    from?: string;
};

type Conversation = {
    id: string;
    userId: string | null;
    messages: string;
    status: string;
    updatedAt: string;
    user?: { name: string | null; cedula: string };
};

export default function WorkerPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (session && (session.user as { role: string }).role === 'WORKER') {
            loadConversations();
        }
    }, [session]);

    const loadConversations = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/conversations');
            const data = await res.json();
            if (data.conversations) {
                setConversations(data.conversations);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectConversation = (conv: Conversation) => {
        setSelectedConversation(conv);
        try {
            const msgs = JSON.parse(conv.messages || '[]');
            setMessages(msgs);
        } catch {
            setMessages([]);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || sending) return;
        
        setSending(true);
        try {
            await fetch('/api/admin/conversations', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId: selectedConversation.id,
                    message: newMessage,
                    status: 'human'
                })
            });
            
            const updatedMessages = [...messages, {
                role: 'user' as const,
                content: newMessage,
                timestamp: new Date().toISOString(),
                from: 'worker'
            }];
            setMessages(updatedMessages);
            setNewMessage('');
            loadConversations();
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const toggleToAI = async (convId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'human' ? 'ai' : 'human';
        try {
            await fetch('/api/admin/conversations', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId: convId,
                    status: newStatus
                })
            });
            loadConversations();
            if (selectedConversation?.id === convId) {
                setSelectedConversation({ ...selectedConversation, status: newStatus });
            }
        } catch (error) {
            console.error('Error toggling AI:', error);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-primary animate-spin">refresh</span>
                    <p className="mt-4 text-xl font-medium text-slate-600">Cargando chats...</p>
                </div>
            </div>
        );
    }

    if (!session || !['ADMIN', 'WORKER'].includes((session.user as { role: string }).role)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
                    <p className="text-slate-600 mt-2">No tienes acceso a esta página.</p>
                    <Link href="/" className="text-primary font-bold mt-4 block">Volver al inicio</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-slate-800">Chats</h1>
                        <button onClick={() => signOut({ callbackUrl: '/' })} className="text-red-600 text-sm font-medium">
                            Salir
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-4 text-center text-slate-500">
                            No hay conversaciones
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <button
                                key={conv.id}
                                onClick={() => selectConversation(conv)}
                                className={`w-full p-4 text-left border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                                    selectedConversation?.id === conv.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-slate-800">
                                        {conv.user?.name || conv.user?.cedula || 'Usuario'}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                        conv.status === 'ai' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                        {conv.status === 'ai' ? '🤖 IA' : '👤 Humano'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 mt-1 truncate">
                                    {conv.user?.cedula || 'Sin cédula'}
                                </p>
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                    <>
                        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-slate-800">
                                    {selectedConversation.user?.name || 'Usuario'}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {selectedConversation.user?.cedula}
                                </p>
                            </div>
                            <button
                                onClick={() => toggleToAI(selectedConversation.id, selectedConversation.status)}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                    selectedConversation.status === 'ai' 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-purple-100 text-purple-700'
                                }`}
                            >
                                {selectedConversation.status === 'ai' ? 'Activar IA 🤖' : 'Pasar a Humano 👤'}
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[70%] p-3 rounded-2xl ${
                                        msg.role === 'user'
                                            ? 'bg-white border border-slate-200'
                                            : 'bg-primary text-white'
                                    }`}>
                                        <p className="text-sm">{msg.content}</p>
                                        <p className={`text-xs mt-1 ${
                                            msg.role === 'user' ? 'text-slate-400' : 'text-blue-200'
                                        }`}>
                                            {msg.from === 'worker' ? 'Trabajador' : msg.role === 'user' ? 'Usuario' : 'IA'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-white border-t border-slate-200">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Escribe un mensaje..."
                                    className="flex-1 border border-slate-200 rounded-lg px-4 py-2"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={sending || !newMessage.trim()}
                                    className="bg-primary text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
                                >
                                    {sending ? 'Enviando...' : 'Enviar'}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500">
                        Selecciona una conversación
                    </div>
                )}
            </div>
        </div>
    );
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { conversationId, message } = await request.json();

        if (!conversationId || !message) {
            return NextResponse.json({ error: 'conversationId y message son requeridos' }, { status: 400 });
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        });

        if (!conversation) {
            return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
        }

        const existingMessages = JSON.parse(conversation.messages || '[]');
        existingMessages.push({
            role: 'assistant',
            content: message,
            timestamp: new Date().toISOString()
        });

        await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                messages: JSON.stringify(existingMessages)
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving AI response:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

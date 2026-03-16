import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const session = await auth();
        const ced = session?.user?.cedula;
        
        const { message, conversationId } = await request.json();

        if (!message?.trim()) {
            return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });
        }

        let conversation;
        let userId = null;

        if (ced) {
            const user = await prisma.user.findUnique({ where: { cedula: ced } });
            userId = user?.id;
        }

        if (conversationId) {
            conversation = await prisma.conversation.findUnique({
                where: { id: conversationId }
            });
        }

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    userId,
                    messages: JSON.stringify([{
                        role: 'user',
                        content: message,
                        timestamp: new Date().toISOString()
                    }]),
                    status: 'ai'
                }
            });
        } else {
            const existingMessages = JSON.parse(conversation.messages || '[]');
            existingMessages.push({
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            });
            
            conversation = await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                    messages: JSON.stringify(existingMessages)
                }
            });
        }

        const config = await prisma.config.findUnique({ where: { id: 'default' } });
        
        const conversationAIEnabled = conversation.aiEnabled ?? config?.aiEnabled ?? true;
        
        if (config?.webhookChatUrl && conversationAIEnabled) {
            try {
                const webhookResponse = await fetch(config.webhookChatUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message,
                        conversationId: conversation.id,
                        userId,
                        history: JSON.parse(conversation.messages || '[]')
                    })
                });

                if (webhookResponse.ok) {
                    const webhookData = await webhookResponse.json();
                    const aiMessage = webhookData.response || webhookData.message || 'Gracias por tu mensaje. Un agente te atenderá pronto.';
                    
                    const messages = JSON.parse(conversation.messages || '[]');
                    messages.push({
                        role: 'assistant',
                        content: aiMessage,
                        timestamp: new Date().toISOString()
                    });

                    await prisma.conversation.update({
                        where: { id: conversation.id },
                        data: { messages: JSON.stringify(messages) }
                    });

                    return NextResponse.json({ 
                        success: true, 
                        response: aiMessage,
                        conversationId: conversation.id 
                    });
                }
            } catch (webhookError) {
                console.error('Error calling n8n webhook:', webhookError);
            }
        }

        const messages = JSON.parse(conversation.messages || '[]');
        messages.push({
            role: 'assistant',
            content: 'Gracias por contactarnos. Un agente te atenderá pronto.',
            timestamp: new Date().toISOString()
        });

        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { messages: JSON.stringify(messages) }
        });

        return NextResponse.json({ 
            success: true, 
            response: 'Gracias por contactarnos. Un agente te atenderá pronto.',
            conversationId: conversation.id 
        });
    } catch (error) {
        console.error('Error in chat:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function GET() {
    const session = await auth();
    const ced = session?.user?.cedula;
    
    if (!ced) {
        return NextResponse.json({ conversations: [] });
    }

    try {
        const user = await prisma.user.findUnique({ 
            where: { cedula: ced },
            include: {
                conversations: {
                    orderBy: { updatedAt: 'desc' }
                }
            }
        });

        return NextResponse.json({ conversations: user?.conversations || [] });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

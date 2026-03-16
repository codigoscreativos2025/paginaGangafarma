import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import prisma from '@/lib/prisma';

export async function GET() {
    const session = await auth();
    const userRole = (session?.user as { role?: string } | undefined)?.role;
    
    if (userRole !== 'ADMIN' && userRole !== 'WORKER') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        let conversations;
        
        if (userRole === 'ADMIN') {
            conversations = await prisma.conversation.findMany({
                orderBy: { updatedAt: 'desc' },
                include: {
                    user: {
                        select: { name: true, cedula: true }
                    }
                }
            });
        } else {
            conversations = await prisma.conversation.findMany({
                where: { status: 'human' },
                orderBy: { updatedAt: 'desc' },
                include: {
                    user: {
                        select: { name: true, cedula: true }
                    }
                }
            });
        }

        return NextResponse.json({ conversations });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const session = await auth();
    const userRole = (session?.user as { role?: string } | undefined)?.role;
    
    if (userRole !== 'ADMIN' && userRole !== 'WORKER') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { conversationId, status, message } = await request.json();

        if (!conversationId) {
            return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        });

        if (!conversation) {
            return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
        }

        const existingMessages = JSON.parse(conversation.messages || '[]');

        if (status) {
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { status }
            });
        }

        if (message) {
            existingMessages.push({
                role: 'user',
                content: message,
                timestamp: new Date().toISOString(),
                from: userRole === 'WORKER' ? 'worker' : 'admin'
            });

            await prisma.conversation.update({
                where: { id: conversationId },
                data: {
                    messages: JSON.stringify(existingMessages),
                    status: 'human'
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating conversation:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

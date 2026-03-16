import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '../../../../auth';

export async function GET() {
    try {
        let config;
        try {
            config = await prisma.config.findUnique({
                where: { id: 'default' }
            });

            if (!config) {
                config = await prisma.config.create({
                    data: { id: 'default', deliveryMinAmount: 5.0, webhookChatUrl: '', aiEnabled: true, defaultOrderMessage: 'gracias por tu compra sube tu comprobante' }
                });
            }
        } catch {
            return NextResponse.json({ config: { deliveryMinAmount: 5.0, webhookChatUrl: '', aiEnabled: true, defaultOrderMessage: 'gracias por tu compra sube tu comprobante' } });
        }

        return NextResponse.json({ config });
    } catch (error) {
        console.error('Error fetching config:', error);
        return NextResponse.json({ config: { deliveryMinAmount: 5.0, webhookChatUrl: '', aiEnabled: true, defaultOrderMessage: 'gracias por tu compra sube tu comprobante' } });
    }
}

export async function PUT(request: Request) {
    const session = await auth();
    const userRole = (session?.user as { role?: string } | undefined)?.role;
    
    if (userRole !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { deliveryMinAmount, webhookChatUrl, aiEnabled, defaultOrderMessage } = body;

        if (deliveryMinAmount !== undefined && (typeof deliveryMinAmount !== 'number' || deliveryMinAmount < 0)) {
            return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
        }

        const updateData: { deliveryMinAmount?: number; webhookChatUrl?: string; aiEnabled?: boolean; defaultOrderMessage?: string } = {};
        if (deliveryMinAmount !== undefined) updateData.deliveryMinAmount = deliveryMinAmount;
        if (webhookChatUrl !== undefined) updateData.webhookChatUrl = webhookChatUrl;
        if (aiEnabled !== undefined) updateData.aiEnabled = aiEnabled;
        if (defaultOrderMessage !== undefined) updateData.defaultOrderMessage = defaultOrderMessage;

        const config = await prisma.config.upsert({
            where: { id: 'default' },
            update: updateData,
            create: { 
                id: 'default', 
                deliveryMinAmount: deliveryMinAmount || 5.0, 
                webhookChatUrl: webhookChatUrl || '', 
                aiEnabled: aiEnabled !== undefined ? aiEnabled : true,
                defaultOrderMessage: defaultOrderMessage || 'gracias por tu compra sube tu comprobante'
            }
        });

        return NextResponse.json({ config });
    } catch (error) {
        console.error('Error updating config:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

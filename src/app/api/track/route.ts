import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const session = await auth();
        let userId = null;
        if (session?.user?.email) {
            const user = await prisma.user.findUnique({ where: { email: session.user.email } });
            userId = user?.id || null;
        }

        const body = await request.json();
        const { codigo, actionType } = body;

        if (!codigo || !actionType) {
            return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
        }

        await prisma.userActionLog.create({
            data: {
                userId,
                guestId: userId ? null : 'guest',
                actionType,
                codigo: String(codigo)
            }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

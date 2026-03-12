import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const users = await prisma.user.findMany({
            include: {
                cartItems: true,
                actionLogs: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const formattedUsers = users.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            cartItemCount: user.cartItems.length,
            actionCount: user.actionLogs.length
        }));

        return NextResponse.json({ users: formattedUsers });
    } catch (e) {
        console.error("Admin Users Error", e);
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
}

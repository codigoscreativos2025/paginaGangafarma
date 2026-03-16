import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import prisma from '@/lib/prisma';

export async function GET() {
    const session = await auth();
    const ced = (session?.user as { cedula?: string } | undefined)?.cedula;
    
    if (!ced) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { cedula: ced },
            include: {
                orders: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        return NextResponse.json({ 
            user: {
                id: user.id,
                name: user.name,
                cedula: user.cedula,
                telefono: user.telefono,
                role: user.role,
                createdAt: user.createdAt
            },
            orders: user.orders
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const session = await auth();
    const ced = (session?.user as { cedula?: string } | undefined)?.cedula;
    
    if (!ced) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { name, telefono } = await request.json();

        const user = await prisma.user.update({
            where: { cedula: ced },
            data: {
                name: name?.trim(),
                telefono: telefono?.trim()
            }
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

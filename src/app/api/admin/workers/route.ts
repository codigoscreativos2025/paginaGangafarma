import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import prisma from '@/lib/prisma';

export async function GET() {
    const session = await auth();
    const userRole = (session?.user as { role?: string } | undefined)?.role;
    
    if (userRole !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const workers = await prisma.user.findMany({
            where: { role: 'WORKER' },
            select: {
                id: true,
                name: true,
                cedula: true,
                telefono: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ workers });
    } catch (error) {
        console.error('Error fetching workers:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();
    const userRole = (session?.user as { role?: string } | undefined)?.role;
    
    if (userRole !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { name, cedula, telefono } = await request.json();

        if (!name || !cedula || !telefono) {
            return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({
            where: { cedula }
        });

        if (existing) {
            await prisma.user.update({
                where: { cedula },
                data: { role: 'WORKER', name, telefono }
            });
            return NextResponse.json({ success: true, message: 'Usuario actualizado a worker' });
        }

        const worker = await prisma.user.create({
            data: {
                name,
                cedula,
                telefono,
                role: 'WORKER'
            }
        });

        return NextResponse.json({ success: true, worker });
    } catch (error) {
        console.error('Error creating worker:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await auth();
    const userRole = (session?.user as { role?: string } | undefined)?.role;
    
    if (userRole !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
        }

        await prisma.user.update({
            where: { id },
            data: { role: 'USER' }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing worker:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import prisma from '@/lib/prisma';

export async function GET() {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const statuses = await prisma.orderStatus.findMany({
            orderBy: { order: 'asc' }
        });
        return NextResponse.json({ statuses });
    } catch (error) {
        console.error('Error fetching statuses:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { name, color, isDefault } = await request.json();

        if (isDefault) {
            await prisma.orderStatus.updateMany({
                where: { isDefault: true },
                data: { isDefault: false }
            });
        }

        const maxOrder = await prisma.orderStatus.findFirst({
            orderBy: { order: 'desc' }
        });

        const status = await prisma.orderStatus.create({
            data: {
                name,
                color: color || '#3b82f6',
                isDefault: isDefault || false,
                order: (maxOrder?.order || 0) + 1
            }
        });

        return NextResponse.json({ status });
    } catch (error) {
        console.error('Error creating status:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { id, name, color, isDefault, isActive } = await request.json();

        if (isDefault) {
            await prisma.orderStatus.updateMany({
                where: { isDefault: true },
                data: { isDefault: false }
            });
        }

        const status = await prisma.orderStatus.update({
            where: { id },
            data: { name, color, isDefault, isActive }
        });

        return NextResponse.json({ status });
    } catch (error) {
        console.error('Error updating status:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    try {
        await prisma.orderStatus.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting status:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

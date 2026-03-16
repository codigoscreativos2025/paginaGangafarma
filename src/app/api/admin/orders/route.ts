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
        const orders = await prisma.order.findMany({
            include: {
                user: {
                    select: { name: true, cedula: true, telefono: true }
                },
                status: true,
                address: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
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
        const { orderId, statusId, paymentStatus, notes } = await request.json();

        const updateData: { statusId?: string; paymentStatus?: string; notes?: string } = {};
        
        if (statusId) updateData.statusId = statusId;
        if (paymentStatus) updateData.paymentStatus = paymentStatus;
        if (notes !== undefined) updateData.notes = notes;

        const order = await prisma.order.update({
            where: { id: orderId },
            data: updateData
        });

        return NextResponse.json({ order });
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

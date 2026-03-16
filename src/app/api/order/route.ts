import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ced = session?.user?.cedula;
    if (!ced) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    try {
        const user = await prisma.user.findUnique({ where: { cedula: ced } });
        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const { items, total, deliveryType, paymentMethod, addressId } = await request.json();

        let deliveryAddress = null;
        let address = null;
        
        if (deliveryType === 'delivery' && addressId) {
            address = await prisma.address.findUnique({ where: { id: addressId } });
            if (address) {
                deliveryAddress = `${address.street}, ${address.city}, ${address.state}`;
            }
        }

        const defaultStatus = await prisma.orderStatus.findFirst({ where: { isDefault: true } });

        const order = await prisma.order.create({
            data: {
                userId: user.id,
                items: JSON.stringify(items),
                total,
                deliveryType,
                paymentMethod,
                deliveryAddress,
                addressId: addressId || null,
                statusId: defaultStatus?.id || null,
                paymentStatus: 'pending'
            }
        });

        return NextResponse.json({ order });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function GET() {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ced = session?.user?.cedula;
    if (!ced) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    try {
        const user = await prisma.user.findUnique({ where: { cedula: ced } });
        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const orders = await prisma.order.findMany({
            where: { userId: user.id },
            include: { status: true },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

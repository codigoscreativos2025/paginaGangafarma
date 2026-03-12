import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import prisma from '@/lib/prisma';
import { db } from '@/lib/db';

export async function GET(request: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ items: [] });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ items: [] });

        const cartItems = await prisma.cartItem.findMany({
            where: { userId: user.id }
        });

        if (cartItems.length === 0) {
            return NextResponse.json({ items: [] });
        }

        // Fetch detailed info for each cart item from the external DB
        const codigos = cartItems.map((i: any) => `'${i.codigo}'`).join(',');
        const [rows]: any = await db.execute(
            `SELECT a.codigoarticulo, a.ddetallada, a.pvreferencial1 as precio_divisa
             FROM v_articulo a
             WHERE a.codigoarticulo IN (${codigos})
             GROUP BY a.codigoarticulo, a.ddetallada, a.pvreferencial1`
        );

        // Match with local overrides for images
        const overrides = await prisma.productOverride.findMany({
            where: { codigo: { in: cartItems.map((i: any) => i.codigo) } }
        });

        const detailedItems = cartItems.map((item: any) => {
            const dbInfo = (rows as any[]).find((r: any) => r.codigoarticulo == item.codigo);
            const override = overrides.find((o: any) => o.codigo === item.codigo);

            return {
                id: item.id,
                codigo: item.codigo,
                quantity: item.quantity,
                ddetallada: dbInfo?.ddetallada || 'Producto desconocido',
                price: parseFloat(dbInfo?.precio_divisa || '0'),
                image: override?.imageUrl || null
            };
        });

        return NextResponse.json({ items: detailedItems });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

        const body = await request.json();
        const { codigo, quantity } = body;

        const existing = await prisma.cartItem.findFirst({
            where: { userId: user.id, codigo }
        });

        let item;
        if (existing) {
            item = await prisma.cartItem.update({
                where: { id: existing.id },
                data: { quantity: existing.quantity + quantity }
            });
        } else {
            item = await prisma.cartItem.create({
                data: { userId: user.id, codigo, quantity }
            });
        }

        // Log Analytics
        await prisma.userActionLog.create({
            data: { userId: user.id, actionType: 'ADD_TO_CART', codigo }
        });

        return NextResponse.json({ success: true, item });
    } catch (e) {
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

        const body = await request.json();
        const { codigo, quantity } = body;

        const existing = await prisma.cartItem.findFirst({
            where: { userId: user.id, codigo }
        });

        if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

        const item = await prisma.cartItem.update({
            where: { id: existing.id },
            data: { quantity }
        });

        return NextResponse.json({ success: true, item });
    } catch (e) {
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

        const { searchParams } = new URL(request.url);
        const codigo = searchParams.get('codigo');

        if (!codigo) return NextResponse.json({ error: 'Falta codigo' }, { status: 400 });

        const existing = await prisma.cartItem.findFirst({
            where: { userId: user.id, codigo }
        });

        if (existing) {
            await prisma.cartItem.delete({ where: { id: existing.id } });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
}

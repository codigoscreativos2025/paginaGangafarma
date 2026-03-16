import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import prisma from '@/lib/prisma';

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
        const user = await prisma.user.findUnique({
            where: { cedula: ced },
            include: {
                addresses: true
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
                addresses: user.addresses
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ced = session?.user?.cedula;
    if (!ced) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    try {
        const { name, telefono } = await request.json();

        await prisma.user.update({
            where: { cedula: ced },
            data: { name, telefono }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

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

        const { street, city, state, zip, isDefault } = await request.json();

        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId: user.id },
                data: { isDefault: false }
            });
        }

        const address = await prisma.address.create({
            data: {
                userId: user.id,
                street,
                city,
                state,
                zip: zip || '',
                isDefault: isDefault || false
            }
        });

        return NextResponse.json({ address });
    } catch (error) {
        console.error('Error creating address:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('id');

    if (!addressId) {
        return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    try {
        await prisma.address.delete({ where: { id: addressId } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting address:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

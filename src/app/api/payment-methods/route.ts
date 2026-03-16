import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const methods = await prisma.paymentMethod.findMany({
            orderBy: { order: 'asc' }
        });
        return NextResponse.json({ methods });
    } catch (error) {
        console.error('Error fetching payment methods:', error);
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
        const { name, instructions } = await request.json();

        if (!name || !instructions) {
            return NextResponse.json({ error: 'Nombre e instrucciones son requeridos' }, { status: 400 });
        }

        const count = await prisma.paymentMethod.count();
        
        const method = await prisma.paymentMethod.create({
            data: {
                name: name.trim(),
                instructions: instructions.trim(),
                order: count
            }
        });

        return NextResponse.json({ success: true, method });
    } catch (error) {
        console.error('Error creating payment method:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const session = await auth();
    const userRole = (session?.user as { role?: string } | undefined)?.role;
    
    if (userRole !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const { id, name, instructions, isActive, order } = await request.json();

        const method = await prisma.paymentMethod.update({
            where: { id },
            data: {
                ...(name && { name: name.trim() }),
                ...(instructions && { instructions: instructions.trim() }),
                ...(typeof isActive === 'boolean' && { isActive }),
                ...(typeof order === 'number' && { order })
            }
        });

        return NextResponse.json({ success: true, method });
    } catch (error) {
        console.error('Error updating payment method:', error);
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

        await prisma.paymentMethod.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting payment method:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

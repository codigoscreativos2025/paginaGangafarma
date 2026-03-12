import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { name, email, password } = await request.json();

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'El correo ya está registrado' }, { status: 400 });
        }

        // Identificar si es el primer usuario en el sistema. Si lo es, darle rol ADMIN
        const count = await prisma.user.count();
        const role = count === 0 ? 'ADMIN' : 'USER';

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password, // Reminder: en produccion real debe hashearse
                role
            }
        });

        return NextResponse.json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Error en registro:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

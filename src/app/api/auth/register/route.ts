import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { name, cedula, telefono } = await request.json();

        if (!name || !cedula || !telefono) {
            return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
        }

        const cedulaClean = String(cedula).trim();
        const telefonoClean = String(telefono).trim();

        if (cedulaClean.length < 5) {
            return NextResponse.json({ error: 'Cédula inválida' }, { status: 400 });
        }

        if (telefonoClean.length < 10) {
            return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { cedula: cedulaClean }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Esta cédula ya está registrada' }, { status: 400 });
        }

        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                cedula: cedulaClean,
                telefono: telefonoClean,
                role: 'USER'
            }
        });

        return NextResponse.json({ success: true, user: { id: user.id, cedula: user.cedula, role: user.role } });
    } catch (error) {
        console.error('Error en registro:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

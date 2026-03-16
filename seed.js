const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const adminCedula = 'admin123456';
    const existingAdmin = await prisma.user.findUnique({ where: { cedula: adminCedula } });

    if (!existingAdmin) {
        await prisma.user.create({
            data: {
                name: 'Super Administrador',
                cedula: adminCedula,
                telefono: 'admingangarma',
                role: 'ADMIN'
            }
        });
        console.log('==== SCRIPT DE INICIO ====');
        console.log('✅ Usuario Super Administrador inyectado de forma automatica.');
        console.log('Cedula: admin123456');
        console.log('Telefono: admingangarma');
        console.log('==========================');
    } else {
        console.log('✅ Usuario administrador ya configurado en dev.db.');
    }
}

main()
    .catch(e => {
        console.error('Error insertando usuario admin:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

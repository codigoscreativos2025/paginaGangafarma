const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@gangafarma.com';
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existingAdmin) {
        // Encriptar la contraseña segura
        const hashedPassword = await bcrypt.hash('admin123456', 10);

        await prisma.user.create({
            data: {
                name: 'Super Administrador',
                email: adminEmail,
                password: hashedPassword,
                role: 'ADMIN' // Rol principal de acceso al Dashboard
            }
        });
        console.log('==== SCRIPT DE INICIO ====');
        console.log('✅ Usuario Super Administrador inyectado de forma automatica.');
        console.log('Correo: admin@gangafarma.com');
        console.log('Password: admin123456');
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

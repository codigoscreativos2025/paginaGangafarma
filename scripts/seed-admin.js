const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'pivotgangafarmaadin@gangafarma.com';
    const name = 'pivotgangafarmaadin';
    const password = 'admingangarma';

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (!existingUser) {
        const admin = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: 'ADMIN',
            },
        });
        console.log('Usuario admin creado:', admin.email);
    } else {
        const admin = await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                role: 'ADMIN',
            }
        });
        console.log('Usuario admin actualizado:', admin.email);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

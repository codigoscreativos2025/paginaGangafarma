require('dotenv').config();
const mysql = require('mysql2/promise');

async function testDB() {
    try {
        const connection = await mysql.createConnection({
            host: 'ceo-soft.com',
            user: 'view_ceosoft_gangafarma',
            password: process.env.DB_PASSWORD || 'V1sual*gangafarma*',
            database: 'ceosoft_gangafarma',
            port: 3306,
        });

        const [rows] = await connection.execute('SELECT id, ddetallada FROM v_articulo LIMIT 3');
        console.log("=== ARTICULOS ===");
        console.log(rows);

        const [existencias] = await connection.execute('SELECT * FROM v_articulo_existencia LIMIT 5');
        console.log("\n=== EXISTENCIAS ===");
        console.log(existencias);

        // Verificamos si podemos obtener categorias unicas
        const [categorias] = await connection.execute('SELECT dclase, COUNT(*) as count FROM v_articulo GROUP BY dclase ORDER BY count DESC LIMIT 8');
        console.log("\n=== CATEGORIAS PRINCIPALES ===");
        console.log(categorias);

        await connection.end();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

testDB();

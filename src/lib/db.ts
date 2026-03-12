import mysql from 'mysql2/promise';

// Create a connection pool to the external SQL endpoint
export const db = mysql.createPool({
    host: 'ceo-soft.com',
    user: 'view_ceosoft_gangafarma',
    password: '7V0TB*84I8EV',
    database: 'ceosoft_gangafarma',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

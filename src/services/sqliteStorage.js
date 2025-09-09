import sqlite3 from "sqlite3";
import path from "path";

// Initialize the database
const dbPath = path.join(process.cwd(), "orders.db");
const db = new sqlite3.Database(dbPath);

// Create the orders table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mlpsz TEXT,
        actualDate TEXT,
        orderDate TEXT,
        customerName TEXT,
        phone TEXT,
        address TEXT,
        description TEXT,
        type TEXT,
        manufacturer TEXT,
        errorDescription TEXT,
        purchaseDate TEXT,
        orderNumber TEXT,
        productId TEXT,
        factoryNumber TEXT,
        serialNumber TEXT,
        note TEXT,
        status TEXT,
        technician TEXT,
        invoice TEXT
    )
`);

// Function to insert an order into the database
export async function appendOrder(order) {
    const query = `
        INSERT INTO orders (
            mlpsz, actualDate, orderDate, customerName, phone, address, description,
            type, manufacturer, errorDescription, purchaseDate, orderNumber,
            productId, factoryNumber, serialNumber, note, status, technician, invoice
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        order.mlpsz,
        order.actualDate,
        order.orderDate,
        order.customerName,
        order.phone,
        order.address,
        order.description,
        order.type,
        order.manufacturer,
        order.errorDescription,
        order.purchaseDate,
        order.orderNumber,
        order.productId,
        order.factoryNumber,
        order.serialNumber,
        order.note,
        order.status,
        order.technician,
        order.invoice,
    ];

    console.log("Inserting order:", values); // Add this line for debugging

    return new Promise((resolve, reject) => {
        db.run(query, values, function (err) {
            if (err) {
                console.error("Failed to save order:", err); // Log the error
                reject(err);
            } else {
                console.log("Order saved to SQLite database with ID:", this.lastID); // Log success
                resolve(this.lastID); // Return the ID of the inserted row
            }
        });
    });
}
export function getAllOrders() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM orders", [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}
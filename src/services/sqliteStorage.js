import sqlite3 from "sqlite3";
import path from "path";

// Initialize the database
const dbPath = path.join(process.cwd(), "orders.db");
const db = new sqlite3.Database(dbPath);

// Create the orders table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clientName TEXT,
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
            clientName, actualDate, orderDate, customerName, phone, address, description,
            type, manufacturer, errorDescription, purchaseDate, orderNumber,
            productId, factoryNumber, serialNumber, note, status, technician, invoice
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        order.clientName,
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

    return new Promise((resolve, reject) => {
        db.run(query, values, function (err) {
            if (err) {
                console.error("Database error - failed to save order:", err.message);
                reject(new Error('Database operation failed'));
            } else {
                resolve(this.lastID); // Return the ID of the inserted row
            }
        });
    });
}
export function getAllOrders(page = 1, limit = 20) {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * limit;
        
        // Get total count
        db.get("SELECT COUNT(*) as total FROM orders", [], (err, countResult) => {
            if (err) {
                reject(err);
                return;
            }
            
            const total = countResult.total;
            const totalPages = Math.ceil(total / limit);
            
            // Get paginated results
            db.all(
                "SELECT * FROM orders ORDER BY id LIMIT ? OFFSET ?",
                [limit, offset],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({
                            orders: rows,
                            pagination: {
                                page: page,
                                limit: limit,
                                total: total,
                                totalPages: totalPages,
                                hasNext: page < totalPages,
                                hasPrev: page > 1
                            }
                        });
                    }
                }
            );
        });
    });
}

// Get single order by ID
export function getOrderById(id) {
    return new Promise((resolve, reject) => {
        const query = "SELECT * FROM orders WHERE id = ?";
        
        db.get(query, [id], (err, row) => {
            if (err) {
                console.error("Database error - failed to get order:", err.message);
                reject(new Error('Database operation failed'));
            } else {
                resolve(row || null); // Return null if no order found
            }
        });
    });
}

// Update specific fields of an order
export function updateOrder(id, updates) {
    return new Promise((resolve, reject) => {
        const fields = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        
        const query = `UPDATE orders SET ${setClause} WHERE id = ?`;
        values.push(id);
        
        db.run(query, values, function(err) {
            if (err) {
                console.error("Database error - failed to update order:", err.message);
                reject(new Error('Database operation failed'));
            } else if (this.changes === 0) {
                reject(new Error('Order not found'));
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
}

// Delete an order by ID
export function deleteOrder(id) {
    return new Promise((resolve, reject) => {
        const query = "DELETE FROM orders WHERE id = ?";
        
        db.run(query, [id], function(err) {
            if (err) {
                console.error("Database error - failed to delete order:", err.message);
                reject(new Error('Database operation failed'));
            } else if (this.changes === 0) {
                reject(new Error('Order not found'));
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
}

// Export as default object for easier importing
const sqliteStorage = {
    appendOrder,
    getAllOrders,
    getOrderById,
    updateOrder,
    deleteOrder
};

export default sqliteStorage;

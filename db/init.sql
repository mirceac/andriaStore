-- Drop tables if they exist (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL,
    image TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    total NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    stripe_session_id TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price NUMERIC NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Comments for understanding the schema
COMMENT ON TABLE users IS 'Stores user account information including authentication and role details';
COMMENT ON TABLE products IS 'Contains product catalog with details like name, description, and pricing';
COMMENT ON TABLE orders IS 'Tracks customer orders with total amount and payment status';
COMMENT ON TABLE order_items IS 'Links products to orders with quantity and price at time of purchase';

-- Column comments for better documentation
COMMENT ON COLUMN users.is_admin IS 'Boolean flag indicating if user has administrative privileges';
COMMENT ON COLUMN orders.stripe_session_id IS 'Reference to Stripe payment session for this order';
COMMENT ON COLUMN orders.status IS 'Current order status (pending, completed, etc.)';
COMMENT ON COLUMN order_items.price IS 'Price of the product at the time of purchase';

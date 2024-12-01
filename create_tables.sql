-- Create Table queries
CREATE TABLE IF NOT EXISTS Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_name VARCHAR(50) NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(20) NOT NULL,
    user_type VARCHAR(10) CHECK (user_type IN ('admin', 'shopper')) NOT NULL
);


CREATE TABLE IF NOT EXISTS Categories (
    category_id INTEGER PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    priority_level INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS Products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    prod_name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    image_url VARCHAR(255) NOT NULL,
    prod_price REAL NOT NULL,
	prod_size REAL NOT NULL,
    category_id INTEGER NOT NULL,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);

CREATE TABLE IF NOT EXISTS Cart (
    cart_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status VARCHAR(10) CHECK (status IN ('purchased', 'new', 'abandoned')) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
	);

CREATE TABLE IF NOT EXISTS CartProducts (
    cart_prod_id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES Cart(cart_id),
    FOREIGN KEY (product_id) REFERENCES Product(product_id)
	);

CREATE TABLE IF NOT EXISTS ProductDetails (
	prod_det_id INTEGER PRIMARY KEY AUTOINCREMENT,
    prod_id INTEGER,
    category_id INTEGER,
    FOREIGN KEY (prod_id) REFERENCES Product(product_id),
    FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);

CREATE TABLE IF NOT EXISTS ExchangeRates (
    base_code VARCHAR(3),
    target_code VARCHAR(3) PRIMARY KEY,
    rate DECIMAL(10, 6)
);

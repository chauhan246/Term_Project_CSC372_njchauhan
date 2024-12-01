const sqlite3 = require('sqlite3').verbose();
// We can add path to persist data
// const db = new sqlite3.Database(':memory:');
const db = new sqlite3.Database('./sqlite.db');
const fs = require('fs');

const createTableQueries = fs.readFileSync("./create_tables.sql", 'utf-8');
const insertCategoriesQueries = fs.readFileSync("./insert_categories.sql", 'utf-8');
const insertProductsQueries = fs.readFileSync("./insert_products.sql", 'utf-8');

// Create new tables & add new data
db.serialize(() => {

  // Create tables
  db.exec(createTableQueries, (err) => {
    if (err) {
      console.error('Error executing SQL file:', err.message);
    } else {
      console.log('Tables created successfully.');
    }
  });

  // Insert categories
  db.exec(insertCategoriesQueries, (err) => {
    if (err) {
      console.error('Error executing SQL file:', err.message);
    } else {
      console.log('Inserted categories successfully.');
    }
  });

  // This is for inserting the products if no products exist
  db.get("SELECT count(*) as count FROM Products", [], (err, row) => {
    if (!err && row.count < 1) {
      db.exec(insertProductsQueries, (err) => {
        if (err) {
          console.error('Error executing SQL file:', err.message);
        } else {
          console.log('Inserted products successfully.');
        }
      });
    }
  });

});

module.exports = db;


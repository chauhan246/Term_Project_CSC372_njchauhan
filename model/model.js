const db = require('../database');

function getCategories(callbackFn) {
  db.all("SELECT * FROM Categories", [], (err, rows) => {
    if (err) {
      return callbackFn(err, null);
    }
    callbackFn(null, rows);
  });
};

function getCategoryById(id, callbackFn) {
  db.get("SELECT * FROM Categories WHERE category_id = ?", [id], (err, row) => {
    if (err) {
      return callbackFn(err, null);
    }
    callbackFn(null, row);
  });
};

function getProducts(category_id, callbackFn) {
  let sql = "SELECT * FROM Products";
  const params = [];

  if (category_id) {
    sql += " WHERE category_id = ?";
    params.push(category_id);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      return callbackFn(err, null);
    }
    callbackFn(null, rows);
  });
};

function getProductById(id, callbackFn) {
  db.get("SELECT * FROM Products WHERE product_id = ?", [id], (err, row) => {
    if (err) {
      return callbackFn(err, null);
    }
    callbackFn(null, row);
  });
};

function updateProduct(product_id, prod_name, description, image_url, prod_price, prod_size, category_id, callbackFn) {
  const sql = `UPDATE Products SET prod_name = ?, description = ?, image_url = ?, prod_price = ?, prod_size = ?, category_id = ? 
               WHERE product_id = ?`;

  db.run(sql, [prod_name, description, image_url, prod_price, prod_size, category_id, product_id], (err) => {
    if (err) {
      return callbackFn(err);
    }
    callbackFn(null);
  });
}

function deleteProduct(product_id, callbackFn) {
  db.run(`DELETE FROM Products WHERE product_id = ?`, [product_id], (err) => {
    if (err) {
      return callbackFn(err);
    }
    callbackFn(null);
  });
}

function addProduct(prod_name, description, image_url, prod_price, prod_size, category_id, callbackFn) {
  const sql = `INSERT INTO Products (prod_name, description, image_url, prod_price, prod_size, category_id) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(sql, [prod_name, description, image_url, prod_price, prod_size, category_id], (err) => {
    if (err) {
      return callbackFn(err);
    }
    callbackFn(null);
  });
}

function addMultipleProducts(products, callbackFn) {
  const placeholders = products.map(() => '(?, ?, ?, ?, ?, ?)').join(',');
  const values = products.flatMap(p => [p.prod_name, p.description, p.image_url, p.prod_price, p.prod_size, p.category_id]);
  const sql = `INSERT INTO Products (prod_name, description, image_url, prod_price, prod_size, category_id) VALUES ${placeholders}`;
  db.run(sql, values, (err) => {
    if (err) {
      return callbackFn(err);
    }
    callbackFn(null);
  });
}

function createCart(user_id, callbackFn) {
  const sql1 = `SELECT * FROM Cart WHERE user_id = ? AND status = 'new'`;
  db.get(sql1, [user_id], (err, row) => {
    if (err) {
      return callbackFn(err, null);
    }
    if (row) {
      return callbackFn(null, row);
    } else {
      const sql2 = `INSERT INTO Cart (user_id, status) VALUES (?, 'new')`;
      db.run(sql2, [user_id], (err, row) => {
        if (err) {
          return callbackFn(err, null);
        }
        callbackFn(null, row);
      });
    }
  });
}

function getCartProducts(cart_id, callbackFn) {
  let sql = "SELECT * FROM CartProducts";
  const params = [];

  if (cart_id) {
    sql += " where cart_id = ?";
    params.push(cart_id);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      return callbackFn(err, null);
    }
    callbackFn(null, rows);
  });
};

function updateCartProduct(cart_prod_id, quantity, callbackFn) {
  if (quantity < 1) {
    removeFromCart(cart_prod_id, callbackFn);
    return callbackFn(null);
  }
  db.run(`UPDATE CartProducts SET quantity = ?  WHERE cart_prod_id = ?`, [quantity, cart_prod_id], (err) => {
    if (err) {
      return callbackFn(err);
    }
    callbackFn(null);
  });
}

function addToCart(user_id, product_id, quantity, callbackFn) {
  db.get(`SELECT * FROM CartProducts WHERE cart_id = (SELECT cart_id FROM Cart WHERE user_id = ? AND status = 'new') AND product_id = ?`,
    [user_id, product_id], (err, row) => {
      if (err) {
        return callbackFn(err);
      }
      if (row) {
        let updatedQuantity = row.quantity + 1;
        const sql = `UPDATE CartProducts SET quantity = ? WHERE cart_id = (SELECT cart_id FROM Cart WHERE user_id = ? AND status = 'new') AND product_id = ?`;
        db.run(sql, [updatedQuantity, user_id, product_id], (err) => {
          if (err) {
            return callbackFn(err);
          }
          callbackFn(null);
        });
      } else {
        const sql = `INSERT INTO CartProducts (cart_id, product_id, quantity) VALUES ((SELECT cart_id FROM Cart WHERE user_id = ? AND status = 'new'), ?, ?)`;
        db.run(sql, [user_id, product_id, quantity], (err) => {
          if (err) {
            return callbackFn(err);
          }
          callbackFn(null);
        });
      }
    });
}

function removeFromCart(cart_prod_id, callbackFn) {
  db.run(`DELETE FROM CartProducts WHERE cart_prod_id = ?`, [cart_prod_id], (err) => {
    if (err) {
      return callbackFn(err);
    }
    callbackFn(null);
  });
}

function emptyCart(user_id, callbackFn) {
  db.run(`UPDATE Cart SET status = 'purchased' WHERE user_id = ? AND status = 'new'`, [user_id], (err) => {
    if (err) {
      return callbackFn(err);
    }
    callbackFn(null);
  });
}

async function getExchangeRate(base_code, target_code, callbackFn) {
  exchangeRateExists(async (err, exchangeRateAvailable) => {
    if (err) {
      return callbackFn(err, null);
    }
    // There is a rate limit on the third party API so only hitting the API once and storing the data in database
    if (!exchangeRateAvailable) {
      // Using Third Part API to fetch currency exchange rates, more info here: https://www.exchangerate-api.com/docs/free
      const response = await fetch("https://open.er-api.com/v6/latest/USD");
      const jsonResponse = await response.json();

      // Insert new Exchange Rates
      const sql = "INSERT OR REPLACE INTO ExchangeRates (base_code, target_code, rate) VALUES (?, ?, ?)";
      for (const [target_code, rate] of Object.entries(jsonResponse.rates)) {
        db.run(sql, [jsonResponse.base_code, target_code, rate], (err) => {
          if (err) {
            console.error(err.message);
          }
        });
      }
    }

    db.get("SELECT * FROM ExchangeRates where base_code = ? AND target_code = ?", [base_code, target_code], (err, row) => {
      if (err) {
        return callbackFn(err, null);
      }
      callbackFn(null, row);
    });
  })

};

function exchangeRateExists(callbackFn) {
  db.get("SELECT count(*) as count FROM ExchangeRates", [], (err, row) => {
    if (err) {
      return callbackFn(err, null);
    }
    return callbackFn(null, row.count > 0);
  });
}

module.exports = {
  getCategories,
  getCategoryById,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addProduct,
  addMultipleProducts,
  createCart,
  getCartProducts,
  updateCartProduct,
  addToCart,
  removeFromCart,
  emptyCart,
  getExchangeRate
};

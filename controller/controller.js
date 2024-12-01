const model = require('../model/model');

function getCategories(req, res) {
  model.getCategories((err, categories) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ categories });
  });
}

function getCategoryById(req, res) {
  const { id } = req.params;
  model.getCategoryById(id, (err, category) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ category });
  });

}

function getProducts(req, res) {
  const { category_id } = req.query;
  model.getProducts(category_id, (err, products) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ products });
  });
}

function getProductById(req, res) {
  const { id } = req.params;
  model.getProductById(id, (err, product) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ product });
  });

}


function updateProduct(req, res) {
  const { id } = req.params;
  const { prod_name, description, image_url, prod_price, prod_size, category_id } = req.body;

  model.updateProduct(id, prod_name, description, image_url, prod_price, prod_size, category_id, (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: "Product updated successfully" });
  });
};

function deleteProduct(req, res) {
  const { id } = req.params;

  model.deleteProduct(id, (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: "Product deleted successfully" });
  });
};


function addProduct(req, res) {
  const { prod_name, description, image_url, prod_price, prod_size, category_id } = req.body;

  if (!prod_name || !description || !image_url || !prod_price || !prod_size || !category_id) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  model.addProduct(prod_name, description, image_url, prod_price, prod_size, category_id, (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: "Product added successfully" });
  });
};


function addMultipleProducts(req, res) {
  const products = req.body.products;

  if (!products) {
    res.status(400).json({ error: "Missing required 1 product" });
    return;
  }

  model.addMultipleProducts(products, (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: "Products added successfully" });
  });
};

function createCart(req, res) {
  const { user_id } = req.body;

  if (!user_id) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  model.createCart(user_id, (err, cart) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ cart });
  });
};

function getCartProducts(req, res) {
  const { cart_id } = req.query;
  model.getCartProducts(cart_id, (err, products) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ products });
  });
}

function updateCartProduct(req, res) {
  const { cart_prod_id, quantity } = req.body;

  model.updateCartProduct(cart_prod_id, quantity, (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: "Product quantity updated successfully" });
  });
}

function addToCart(req, res) {
  const { user_id, product_id, quantity } = req.body;

  if (!user_id || !product_id || !quantity) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  model.addToCart(user_id, product_id, quantity, (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: "Product added to cart successfully" });
  });
};

function removeFromCart(req, res) {
  const { id } = req.params;

  model.removeFromCart(id, (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: "Product removed from cart successfully" });
  });
};

function emptyCart(req, res) {
  const { user_id } = req.body;

  if (!user_id) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  model.emptyCart(user_id, (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: "Products checked out successfully" });
  });
};

function getExchangeRate(req, res) {
  const { base_code, target_code } = req.params;
  model.getExchangeRate(base_code, target_code, (err, rate) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ rate });
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
const express = require('express');
const router = express.Router();
const controller = require('../controller/controller');

router.get('/categories', controller.getCategories);

router.get('/categories/:id', controller.getCategoryById);

router.get('/products', controller.getProducts);

router.get('/products/:id', controller.getProductById);

router.post('/products', controller.addProduct);

router.post('/products/multiple', controller.addMultipleProducts);

router.put('/products/:id', controller.updateProduct);

router.delete('/products/:id', controller.deleteProduct);

router.post('/cart', controller.createCart);

router.get('/cartproducts', controller.getCartProducts);

router.put('/cartproducts', controller.updateCartProduct);

router.post('/cartproducts', controller.addToCart);

router.post('/cartproducts/empty', controller.emptyCart);

router.delete('/cartproducts/:id', controller.removeFromCart);

router.get('/exchangerates/base/:base_code/target/:target_code', controller.getExchangeRate);

module.exports = router;

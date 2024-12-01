// Hard coded user_id since I am not supporting login/logout
let user_id = 456;
// For getting product details
let current_product_id = null;

// Initial Load
document.addEventListener('DOMContentLoaded', async () => {
    // Figure out what page i am on (e.g. home.html, products.html)
    const currentPage = window.location.pathname.split("/").pop();
    // For getting url query params
    const urlParams = new URLSearchParams(window.location.search);

    if (currentPage === 'products.html') {
        fetchProducts();
        fetchCategories();
    } else if (currentPage === 'details.html') {
        current_product_id = urlParams.get('product_id');
        if (current_product_id) {
            fetchProductDetails(current_product_id)
        }
        id('add-product-to-cart').addEventListener('click', addProductToCart)
    } else if (currentPage === 'cart.html') {
        let cart_id = await createCart(user_id);
        if (cart_id) {
            fetchCartProducts(cart_id);
        }
        id('empty-cart').addEventListener('click', emptyCart)
    } else if (currentPage === 'admin-products.html') {
        fetchProductsForAdmin();
    } else if (currentPage === 'product-add.html') {
        fetchCategoriesForAdmin("add");
        id('add-product-form').addEventListener('submit', addProduct);
    } else if (currentPage === 'product-edit.html') {
        current_product_id = urlParams.get('product_id');
        if (current_product_id) {
            populateEditProduct(current_product_id)
        }
        id('edit-product-form').addEventListener('submit', updateProduct);
    } else if (currentPage === 'admin-upload.html') {
        qs('form').addEventListener('submit', addBulkProducts);
    }
});


// Always have one new cart ready even after cart is checked out (empty)
async function createCart(user_id) {
    let cart_id = null;
    await fetch(`/fragrance/cart`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id })
    })
        .then(response => response.json())
        .then(response => {
            cart_id = response?.cart?.cart_id;
        })
        .catch(error => console.error('Error:', error));
    return cart_id;
}

// Get the products added to cart
function fetchCartProducts(cart_id) {
    fetch(`/fragrance/cartproducts?cart_id=${cart_id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(async response => {
            const cartItems = id('cart-items');
            cartItems.innerHTML = '';
            let subtotal = 0;

            for (const cartproduct of response.products) {
                let product = await fetchProductById(cartproduct?.product_id);
                subtotal += product?.prod_price * cartproduct?.quantity;
                const itemHTML = `
                <div class="cart-item" data-cart-prod-id=${cartproduct?.cart_prod_id}>
                    <img src="${product?.image_url}" alt="${product?.prod_name}">
                    <div class="item-info">
                        <h3>${product?.prod_name}</h3>
                        <p class="item-size">Size: ${product?.prod_size}</p>
                        <p class="item-price">$${product?.prod_price?.toFixed(2)}</p>
                        <input type="number" value="${cartproduct?.quantity}" min="${1}" class="quantity">
                        <button class="update-button">Update</button>
                        <button class="remove-button">Remove</button>
                    </div>
                    <div class="total-per-items">$${(product?.prod_price * cartproduct?.quantity).toFixed(2)}</div>
                </div>
            `;
                cartItems.insertAdjacentHTML('beforeend', itemHTML);
            };

            // Add event listeners to update and remove buttons
            qsa('.update-button').forEach(button => {
                button.addEventListener('click', updateProductInCart);
            });

            qsa('.remove-button').forEach(button => {
                button.addEventListener('click', removeProductInCart);
            });

            const taxRate = 0.0675;
            const tax = subtotal * taxRate;
            const total = subtotal + tax;

            id('subtotal').textContent = `Subtotal: $${subtotal.toFixed(2)}`;
            id('tax').textContent = `Tax (6.75%): $${tax.toFixed(2)}`;
            id('total').textContent = `Total USD: $${total.toFixed(2)}`;

            id('currency').addEventListener('change', async (event) => {
                let target = event?.target?.value;
                let rate = await fetchExchangeRate(target);
                id('currency-exchange-rate').textContent = `Total ${rate?.target_code}: $${(total * rate?.rate).toFixed(2)}`;
            })
        })
        .catch(error => console.error('Error:', error));
}

// Add product from home page and cart page
async function addProductToCart(event) {
    event.preventDefault();
    let product_id = current_product_id; // from cart page
    if (event?.target?.dataset?.productId) {
        product_id = event?.target?.dataset?.productId; // from home page
    }

    let quantity = 1;
    await fetch(`/fragrance/cartproducts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id, product_id, quantity })
    })
        .then(response => response.json())
        .then(response => {
            window.location.href = 'cart.html';
        })
        .catch(error => console.error('Error:', error));
}

// Update product quantity
function updateProductInCart(event) {
    const cartItem = event.target.closest('.cart-item');
    const cart_prod_id = cartItem.dataset.cartProdId;
    const quantity = cartItem.querySelector('.quantity').value;
    fetch(`/fragrance/cartproducts`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cart_prod_id, quantity })
    })
        .then(response => response.json())
        .then(response => {
            window.location.href = 'cart.html';
        })
        .catch(error => console.error('Error:', error));
}

// Remove product from cart
function removeProductInCart(event) {
    const cartItem = event.target.closest('.cart-item');
    const cart_prod_id = cartItem.dataset.cartProdId;
    fetch(`/fragrance/cartproducts/${cart_prod_id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(response => {
            window.location.href = 'cart.html';
        })
        .catch(error => console.error('Error:', error));
}

// Empty the cart when checkout button is hit
function emptyCart(event) {
    fetch(`/fragrance/cartproducts/empty`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id })
    })
        .then(response => response.json())
        .then(response => {
            window.location.href = 'cart.html';
        })
        .catch(error => console.error('Error:', error));
}

// Get product details
async function fetchProductDetails(product_id) {
    let product = null;
    await fetch(`/fragrance/products/${product_id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(async response => {
            const productData = response.product;
            product = productData;
            let category = null;

            if (productData?.category_id) {
                category = await fetchCategoryById(productData?.category_id);
            }
            id('prod-image').src = productData?.image_url;
            id('prod-name').textContent = productData?.prod_name;

            const prodCat = id('prod-category');
            prodCat.innerHTML = `<span class="label">Category:</span> ${category?.category_name}`

            const prodDesc = id('prod-description');
            prodDesc.innerHTML = `<span class="label">Description:</span> ${productData?.description}`

            const prodSize = id('prod-size');
            prodSize.innerHTML = `<span class="label">Size:</span> ${productData?.prod_size}`

            id('prod-price').textContent = `$${productData?.prod_price?.toFixed(2)}`;
        })
        .catch(error => console.error('Error:', error));

    return product;
}

// Get single product
async function fetchProductById(product_id) {
    let product = null;
    await fetch(`/fragrance/products/${product_id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(response => {
            product = response.product;
        })
        .catch(error => console.error('Error:', error));

    return product;
}

// Add new product
function addProduct(event) {
    event.preventDefault();
    const prod_name = id('prod-name-add')?.value;
    const description = id('prod-desc-add')?.value;
    let image_url = "../images/"
    image_url += id('prod-image-add')?.value;
    image_url += ".jpg";

    const prod_price = id('prod-price-add')?.value;
    const prod_size = id('prod-size-add')?.value;
    const category_id = id('prod-category-add')?.value;

    fetch(`/fragrance/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prod_name, description, image_url, prod_price, prod_size, category_id })
    })
        .then(response => response.json())
        .then(response => {
            window.location.href = 'admin-products.html';
        })
        .catch(error => console.error('Error:', error));
}

// Add multiple products at once
async function addBulkProducts(event) {
    event.preventDefault();
    const fileInput = document.getElementById('file-upload');

    const file = fileInput.files[0];
    if (file && file.type === 'application/json') {
        try {
            const fileContent = await readFile(file);
            const products = JSON.parse(fileContent).products;
            products.forEach(product => {
                let image_url = "../images/";
                image_url += product.image_url;
                image_url += ".jpg";
                product.image_url = image_url;
            });

            fetch(`/fragrance/products/multiple`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ products })
            })
                .then(response => response.json())
                .then(response => {
                    window.location.href = 'admin-products.html';
                })
                .catch(error => console.error('Error:', error));
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    }
}

// For reading the file content
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

// Pre-fill product being updated
async function populateEditProduct(product_id) {
    const product = await fetchProductById(product_id);

    // I have to parse out the image name since I programatically add/update the image path.
    let imagePath = product.image_url
    let filename = imagePath.split('/').pop();
    let prod_image = filename.split('.')[0];

    id('prod-name-edit').value = product?.prod_name;
    id('prod-image-edit').value = prod_image;
    id('prod-desc-edit').value = product?.description;
    id('prod-size-edit').value = product?.prod_size;
    id('prod-price-edit').value = product?.prod_price?.toFixed(2);
    fetchCategoriesForAdmin("edit", product?.category_id);
}

// Update product
function updateProduct(event) {
    event.preventDefault();
    const prod_name = id('prod-name-edit')?.value;
    const description = id('prod-desc-edit')?.value;
    let image_url = "../images/"
    image_url += id('prod-image-edit')?.value;
    image_url += ".jpg";

    const prod_price = id('prod-price-edit')?.value;
    const prod_size = id('prod-size-edit')?.value;
    const category_id = id('prod-category-edit')?.value;

    fetch(`/fragrance/products/${current_product_id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prod_name, description, image_url, prod_price, prod_size, category_id })
    })
        .then(response => response.json())
        .then(response => {
            window.location.href = 'admin-products.html';
        })
        .catch(error => console.error('Error:', error));
}

// Delete a product
function deleteProduct(event) {
    event.preventDefault();
    const deleteItem = event.target;
    const product_id = deleteItem.dataset.productId;

    fetch(`/fragrance/products/${product_id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(response => {
            window.location.href = 'admin-products.html';
        })
        .catch(error => console.error('Error:', error));
}

// Get all products
function fetchProducts(category_id = null) {
    let url = '/fragrance/products';
    if (category_id) {
        url += `?category_id=${category_id}`;
    }
    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(response => {
            const productItems = id('product-items');
            productItems.innerHTML = '';
            response.products.forEach(product => {
                const productHTML = `
                <div class="column">
                    <a href="details.html?product_id=${product.product_id}">
                        <img src="${product.image_url}" alt="Luxury Fragrance Product ${product.product_id}">
                    </a>
                    <span>$${product?.prod_price?.toFixed(2)}</span>
                    <label>${product.prod_name}</label>
                    <button class="cart" id="product_id_${product.product_id}" data-product-id="${product.product_id}">Add</button>
                </div>
            `;
                productItems.insertAdjacentHTML('beforeend', productHTML);
            });

            // Add event listeners to each "Add" button
            qsa('.cart').forEach(button => {
                button.addEventListener('click', addProductToCart);
            });
        })
        .catch(error => console.error('Error:', error));
}

// Get all products for an admin, there is some code repeat since i'm using code logic inside the methods
function fetchProductsForAdmin(category_id = null) {
    let url = '/fragrance/products';
    if (category_id) {
        url += `?category_id=${category_id}`;
    }
    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(async response => {
            const productTableBody = qs('.prod_list tbody');

            productTableBody.innerHTML = '';

            for (const product of response.products) {
                let category = "N/A"
                if (product?.category_id) {
                    category = await fetchCategoryById(product?.category_id);
                }
                const rowHTML = `
                <tr>
                    <td>${product.product_id}</td>
                    <td>${product.prod_name}</td>
                    <td><img src="${product.image_url}" alt="product image" width="50"></td>
                    <td>${product.description}</td>
                    <td>${product.prod_size}</td>
                    <td>${category.category_name}</td>
                    <td>$${product?.prod_price?.toFixed(2)}</td>
                    <td>
                        <a href="product-edit.html?product_id=${product.product_id}"><button>Edit</button></a>
                        <button id="delete-product-id-${product.product_id}" data-product-id="${product.product_id}">Delete</button>
                    </td>
                </tr>
            `;
                productTableBody.insertAdjacentHTML('beforeend', rowHTML);
                id(`delete-product-id-${product.product_id}`).addEventListener('click', deleteProduct)
            };
        })
        .catch(error => console.error('Error:', error));
}

// Get all existing product categories (e.g. male, female)
function fetchCategories() {
    fetch('/fragrance/categories', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(response => {
            const categoryFilter = id('category-filter');
            response.categories.forEach(category => {
                const option = ce('option');
                option.value = category.category_id;
                option.textContent = category.category_name;
                categoryFilter.appendChild(option);
            });

            categoryFilter.addEventListener('change', () => {
                selectedCategory = categoryFilter.value;
                fetchProducts(selectedCategory);
            });
        })
        .catch(error => console.error('Error:', error));
}

// Get categories for admin, again some repeat code since i'm using code logic in fetch APIs
function fetchCategoriesForAdmin(action, selectedCategory = null) {
    fetch('/fragrance/categories', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(response => {
            let prodCategory = id(`prod-category-${action}`);
            response.categories.forEach(category => {
                const option = ce('option');
                option.value = category.category_id;
                option.textContent = category.category_name;
                if (category.category_id === selectedCategory) {
                    option.selected = true;
                }
                prodCategory.appendChild(option);
            });

            prodCategory.addEventListener('change', () => {
                selectedCategory = prodCategory.value;
            });
        })
        .catch(error => console.error('Error:', error));
}

// Get a category by id
async function fetchCategoryById(id) {
    let category = null;
    await fetch(`/fragrance/categories/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(response => {
            category = response.category;
        })
        .catch(error => console.error('Error:', error));

    return category
}

// 3rd party API has currency exchange rates
async function fetchExchangeRate(target) {
    let rate = null;
    await fetch(`/fragrance/exchangerates/base/USD/target/${target}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(response => {
            rate = response?.rate;
        })
        .catch(error => console.error('Error:', error));
    return rate;
}


/*
* Handy Shortcut Functions
*/

function id(id) {
    return document.getElementById(id);
}

function qs(selector) {
    return document.querySelector(selector);
}

function qsa(selector) {
    return document.querySelectorAll(selector);
}

function ce(element) {
    return document.createElement(element);
}
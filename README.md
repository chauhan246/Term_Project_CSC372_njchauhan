# Luxury Fragrance

This full-stack application lets the user view, buy, and manage fragrance products.

Start the Application:
```sh
npm run start
```

### UI

The application will be available at:
```sh
http://localhost:3000/
```

Once you see the ad, click on `Explore Now` which will take you to the home page.

The home page is just for advertisement and does not have any functionality.

#### User
The functional components are according to the project requirments. The `Products` button will display all the available products.
If you click on any of the products, it will show you the details. The `Add` button will add the product to the cart. While in 
the `Cart`, you can update the product quantity, completely remove the product, and also checkout (empty) the cart.

#### Admin
In the home page, you can hover over `Accounts` which will provide you with the option to go to `Admin` page. Once in the admin page,
you can add one product at a time or bulk upload, delete a product, and update a product listing. 

### Application Functionalities

- viewing product lists, including viewing by category.
- viewing one product with details.
- adding products to a cart.
- removing products from a cart.
- checkout (empty a cart).
- Admin
    - Editing a product, changing a listing.
    - Adding a new product.
    - Bulk uploading new products from JSON.
- 3rd party API used (Currency Exchange - https://open.er-api.com/v6/latest/USD)
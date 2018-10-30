const Product = require("../models/product");

exports.getAddProduct = (req, res, next) => {
    res.render('admin/add-product', 
        {
            pageTitle: 'Add Product', 
            path:'/admin/add-product',
        }
    );
}

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title,
          imageUrl = req.body.imageUrl,
          description = req.body.description,
          price = req.body.price;
    const product = new Product(title, imageUrl, description, price);
    product.save();
    res.redirect('/');
}

exports.getProducts = (req, res, next) => {
    Product.fetchAll((products) => {
        res.render('admin/products', 
            {
                pageTitle: 'Admin Products', 
                prods: products, 
                path: '/admin/products', 
            }
        );
    }); 
}
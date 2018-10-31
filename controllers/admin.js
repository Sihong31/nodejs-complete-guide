const Product = require('../models/product');


exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', 
        {
            pageTitle: 'Add Product', 
            path:'/admin/add-product',
            editing: false
        }
    );
}

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title,
          imageUrl = req.body.imageUrl,
          description = req.body.description,
          price = req.body.price,
          userId = req.user._id,
          product = new Product(title, price, description, imageUrl, null, userId);
    product
        .save()
        .then(result => {
            console.log('Created Product');
            res.redirect('/admin/products');
        })
        .catch(err => {
            console.log(err);
        });
   
}

exports.getEditProduct = (req, res, next) => {
    const editMode = (req.query.edit === 'true');
    if(!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return res.redirect('/');
            }
            res.render('admin/edit-product', 
                {
                    pageTitle: 'Edit Product',   
                    path:'/admin/edit-product',
                    editing: editMode,
                    product: product
                }
            );
        })
        .catch(err => {
            console.log(err);
        });
}

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId,
          updatedTitle = req.body.title,
          updatedPrice = req.body.price,
          updatedDescription = req.body.description,
          updatedImageUrl = req.body.imageUrl;
              
    const product = new Product(updatedTitle, updatedPrice, updatedDescription, updatedImageUrl, prodId);
    product
        .save()
        .then(result => {
            console.log('UPDATED PRODUCT');
            res.redirect('/admin/products');
        })
        .catch(err => { 
            console.log(err 
        )});
};

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    Product.deleteById(prodId)
        .then(() => {
            console.log('Product Deleted');
            res.redirect('/admin/products');
        })
        .catch(err => {
            console.log(err);
        });
};

exports.getProducts = (req, res, next) => {
    Product.fetchAll()
        // Product.findAll()
        .then(products => {
            res.render('admin/products', 
            {
                pageTitle: 'Admin Products', 
                prods: products, 
                path: '/admin/products', 
            }
        );
        })
        .catch(err => {
            console.log(err);
        });
}
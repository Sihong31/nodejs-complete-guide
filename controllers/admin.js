const { validationResult } = require('express-validator/check');

const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', 
        {
            pageTitle: 'Add Product', 
            path:'/admin/add-product',
            editing: false,
            hasError: false,
            errorMessage: null,
            validationErrors: []
        }
    );
}

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title,
          imageUrl = req.body.imageUrl,
          description = req.body.description,
          price = req.body.price,
          userId = req.user._id,
          product = new Product({
              title: title,
              price: price,
              description: description,
              imageUrl: imageUrl,
              userId: userId
          }),
          errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', 
        {
            pageTitle: 'Add Product',   
            path:'/admin/edit-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                imageUrl: imageUrl,
                price: price,
                description: description
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }
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
                    product: product,
                    hasError: false,
                    errorMessage: null,
                    validationErrors: []
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
          updatedImageUrl = req.body.imageUrl,
          errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).render('admin/edit-product', 
            {
                pageTitle: 'Edit Product',   
                path:'/admin/edit-product',
                editing: true,
                hasError: true,
                product: {
                    title: updatedTitle,
                    imageUrl: updatedImageUrl,
                    price: updatedPrice,
                    description: updatedDescription,
                    _id: prodId
                },
                errorMessage: errors.array()[0].msg,
                validationErrors: errors.array()
            });
        }
    Product.findById(prodId)
        .then(product => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }
            product.title = updatedTitle;
            product.price = updatedPrice;
            product.description = updatedDescription;
            product.imageUrl = updatedImageUrl
            // mongoose save will automatically check if product already exists and update the existing product instead of creating a new one
            return product.save().then(result => {
                console.log('UPDATED PRODUCT');
                res.redirect('/admin/products');
            });
        })
        .catch(err => { 
            console.log(err);
        });
};

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    Product.deleteOne({_id: prodId, userId: req.user._id})
        .then(() => {
            console.log('Product Deleted');
            res.redirect('/admin/products');
        })
        .catch(err => {
            console.log(err);
        });
};

exports.getProducts = (req, res, next) => {
    Product.find({ userId: req.user._id})
        // .select allows you to choose which fields to display or which fields to remove from display
        // .populate allows you to fetch the full set of data from a reference id, and also pick which fields to display as a second arg
        // .select('title price -_id')
        // .populate('userId', 'name')
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
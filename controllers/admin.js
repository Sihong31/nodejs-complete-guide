const mongoose = require('mongoose');
const fileHelper = require('../util/file');

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
          image = req.file,
          description = req.body.description,
          price = req.body.price,
          userId = req.user._id,
          errors = validationResult(req);
    
    if (!image) {
        return res.status(422).render('admin/edit-product', 
        {
            pageTitle: 'Add Product',   
            path:'/admin/add-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                price: price,
                description: description
            },
            errorMessage: 'Attached file is not an image',
            validationErrors: errors.array()
        });
    }
          
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', 
        {
            pageTitle: 'Add Product',   
            path:'/admin/add-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                price: price,
                description: description
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    const imageUrl = image.path;

    const product = new Product({
        //   _id: mongoose.Types.ObjectId('5be0c0b43004f82f8cc8af2d'),
            title: title,
            price: price,
            description: description,
            imageUrl: imageUrl,
            userId: userId
        });

    product
        .save()
        .then(result => {
            console.log('Created Product');
            res.redirect('/admin/products');
        })
        .catch(err => {  
            // return res.status(500).render('admin/edit-product', 
            // {
            //     pageTitle: 'Add Product',   
            //     path:'/admin/add-product',
            //     editing: false,
            //     hasError: true,
            //     product: {
            //         title: title,
            //         imageUrl: imageUrl,
            //         price: price,
            //         description: description
            //     },
            //     errorMessage: 'Database operation failed, please try again.',
            //     validationErrors: []
            // });
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
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
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId,
          updatedTitle = req.body.title,
          updatedPrice = req.body.price,
          updatedDescription = req.body.description,
          image = req.file,
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
            if (image) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = image.path;
            }
            // mongoose save will automatically check if product already exists and update the existing product instead of creating a new one
            return product.save().then(result => {
                console.log('UPDATED PRODUCT');
                res.redirect('/admin/products');
            });
        })
        .catch(err => { 
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return next(new Error('Product not found!'));
            }
            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({_id: prodId, userId: req.user._id})
        })
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
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}
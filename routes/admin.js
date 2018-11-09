const path = require('path');

const express = require('express');
const { check } = require('express-validator/check');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/add-product => POST
router.post('/add-product', [
    check('title')
        .isString()
        .isLength({ min: 3 })
        .trim(),
    check('price')
        .isFloat(),
    check('description')
        .isLength({ min: 5, max: 400 })
        .trim()
], isAuth, adminController.postAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// /admin/edit-product/:productId => GET
router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

// // /admin/edit-product => POST
router.post('/edit-product', [
    check('title')
    .isString()
    .isLength({ min: 3 })
    .trim(),
    check('price')
        .isFloat()
        .trim(),
    check('description')
        .isLength({ min: 5, max: 400 })
        .trim()
], isAuth, adminController.postEditProduct);

// // /admin/delete-product => POST
router.delete('/product/:productId', isAuth, adminController.deleteProduct);


module.exports = router;
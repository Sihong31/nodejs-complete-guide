const mongodb = require("mongodb");

const getDb = require("../util/database").getDb;

class User {
    constructor(username, email, cart, userId) {
        this.username = username;
        this.email = email;
        this.cart = cart; // { items: []}
        this._id = userId;
    }

    save() {
        const db = getDb();
        return db.collection('users')
            .insertOne(this)
            .then(result => {
                console.log('User created');
            })
            .catch(err => {
                console.log(err);
            });
    }

    addToCart(product) {
        const cartProductIndex = this.cart.items.findIndex(cp => {
            return cp.productId.toString() === product._id.toString();
        });
        let newQuantity = 1;
        const updatedCartItems = [...this.cart.items];
        if (cartProductIndex >= 0) {
            newQuantity = this.cart.items[cartProductIndex].quantity + 1; 
            updatedCartItems[cartProductIndex].quantity = newQuantity;
        } else {
            updatedCartItems.push({ productId: new mongodb.ObjectId(product._id), quantity: newQuantity })
        }
        
        const updatedCart = {items: updatedCartItems};
        const db = getDb();
        return db
            .collection('users')
            .updateOne({ _id: new mongodb.ObjectId(this._id) }, { $set: {cart: updatedCart} });
    }

    getCart() {
        const db = getDb();
        const productIds = this.cart.items.map(i => {
            return i.productId;
        });
        return db
            .collection('products')
            .find({_id: {$in : productIds}})
            .toArray()
            .then(products => {
                return products.map(product => {
                    return {...product, quantity: this.cart.items.find(i => {
                        return i.productId.toString() === product._id.toString();
                    }).quantity};
                });
            });
    }

    deleteItemFromCart(productId) {
        const updatedCartItems = this.cart.items.filter(item => {
            // use toString to make sure both sides are strings, mongodb.ObjectId type differs
            return item.productId.toString() !== productId.toString();
        });
        const db = getDb();
        return db 
            .collection('users')
            .updateOne({_id: new mongodb.ObjectId(this._id)}, { $set: { cart: { items: updatedCartItems }}})
    }

    addOrder() {
        const db = getDb();
        return this.getCart()
            .then(products => {
                const order = {
                    items: products,
                    user: {
                        _id: new mongodb.ObjectId(this._id),
                        name: this.name,
                        email: this.email
                    }
                }
                return db.collection('orders').insertOne(order);
            })
            .then(result => {
                this.cart = { items: [] };
                return db
                    .collection('users')
                    .updateOne({_id: new mongodb.ObjectId(this._id)}, { $set: { cart: this.cart }})
            });
    }

    getOrders() {
        const db = getDb();
        return db
            .collection('orders')
            .find({'user._id': new mongodb.ObjectId(this._id)})
            .toArray();
    }

    static findById(userId) {
        const db = getDb();
        return db.collection('users')
            .findOne({_id: new mongodb.ObjectId(userId)})
            .then(user => {
                return user;
            })
            .catch(err => {
                console.log(err);
            })
    }
}

module.exports = User;
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
    // mongoose provides the option to require certain fieldNames even though you are working with documents
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    // refer to User model and set up relation with the User's ObjectId
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('Product', productSchema);

// const mongodb = require("mongodb");

// const getDb = require('../util/database').getDb;

// class Product {
//     constructor(title, price, description, imageUrl, id, userId) {
//         this.title = title;
//         this.price = price;
//         this.description = description;
//         this.imageUrl = imageUrl;
//         this._id = id ? new mongodb.ObjectId(id) : null;
//         this.userId = userId;
//     }

//     save() {
//         const db = getDb();
//         let dbOp;
//         if(this._id) {
//             // update product
//             dbOp = db.collection('products').updateOne({ _id: this._id }, { $set: this });
//         } else {
//             // insert product
//             dbOp = db.collection('products').insertOne(this);
//         }
      
//         return dbOp
//             .then(result => {
//                 console.log('Product created');
//             })
//             .catch(err => {
//                 console.log(err);
//             });
//     }

//     static deleteById(prodId) {
//         const db = getDb();
//         return db
//             .collection('products')
//             .deleteOne({_id: new mongodb.ObjectID(prodId)})
//             .then(result => {
//                 console.log('Deleted!');
//             })
//             .catch(err => {
//                 console.log(err);
//             });
//     }

//     static fetchAll() {
//         const db = getDb();
//         return db.collection('products')
//             // find returns a cursor, toArray if you know you won't be returning too many documents
//             .find().toArray()
//             .then(products => {
//                 return products;
//             })
//             .catch(err => {
//                 console.log(err);
//             })
//     }

//     static findById(prodId) {
//         const db = getDb();
//         return db.collection('products')
//             // find returns a cursor, use next to get to first element
//             .find({_id: new mongodb.ObjectId(prodId)})
//             .next()
//             .then(product => {
//                 return product;
//             })
//             .catch(err => {
//                 console.log(err);
//             })
//     }
// }


// module.exports = Product;
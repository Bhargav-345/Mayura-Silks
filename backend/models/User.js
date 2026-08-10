const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    cart: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            qty: { type: Number, default: 1 }
        }
    ],
    wishlist: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
    ]
});

module.exports = mongoose.model('User', userSchema);
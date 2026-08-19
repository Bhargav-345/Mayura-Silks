require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();
const port = 3000;
const cors = require('cors');
app.use(cors());
app.use(express.json());
const { verifyToken, verifyAdmin } = require('./authMiddleware');


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Mongodb Connected'))
    .catch(err => console.log('MongoDB connection error:', err));

const JWT_SECRET = process.env.JWT_SECRET;

app.get('/', (req, res) => {
    res.send('Backend running');
});

// REGISTER a new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user._id, isAdmin: user.isAdmin },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token, user: { name: user.name, email: user.email, isAdmin: user.isAdmin } });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const { category } = req.query;
        const filter = category ? { category } : {};
        const products = await Product.find(filter);
        res.json(products);
    }
    catch (err) {
        res.status(500).json({ error: 'failed to fetch products' });
    }
});

// ── CART ──

// GET current user's cart
app.get('/api/cart', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate('cart.product');
        res.json(user.cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADD an item to cart
app.post('/api/cart', verifyToken, async (req, res) => {
    try {
        const { productId, qty } = req.body;
        const user = await User.findById(req.user.userId);

        const existing = user.cart.find(item => item.product.toString() === productId);
        if (existing) {
            existing.qty += qty || 1;
        } else {
            user.cart.push({ product: productId, qty: qty || 1 });
        }

        await user.save();
        const updated = await user.populate('cart.product');
        res.json(updated.cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE quantity of a specific cart item
app.put('/api/cart/:productId', verifyToken, async (req, res) => {
    try {
        const { qty } = req.body;
        const user = await User.findById(req.user.userId);

        const item = user.cart.find(item => item.product.toString() === req.params.productId);
        if (!item) return res.status(404).json({ error: 'Item not in cart' });

        item.qty = qty;
        await user.save();
        const updated = await user.populate('cart.product');
        res.json(updated.cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// REMOVE an item from cart
app.delete('/api/cart/:productId', verifyToken, async (req, res) => {
    try {
        // FIXED: was findByIdAndDelete — that deleted the entire user account
        // every time someone removed a single cart item. Should only fetch the user.
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.cart = user.cart.filter(item => item.product.toString() !== req.params.productId);
        await user.save();
        res.json(user.cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── WISHLIST ──

// GET current user's wishlist (populated)
app.get('/api/wishlist', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate('wishlist');
        res.json(user.wishlist);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADD an item to wishlist (no duplicates)
app.post('/api/wishlist', verifyToken, async (req, res) => {
    try {
        const { productId } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user.wishlist.includes(productId)) {
            user.wishlist.push(productId);
            await user.save();
        }

        const updated = await user.populate('wishlist');
        res.json(updated.wishlist);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// REMOVE an item from wishlist
app.delete('/api/wishlist/:productId', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.wishlist = user.wishlist.filter(id => id.toString() !== req.params.productId);
        await user.save();
        res.json(user.wishlist);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── ORDERS ──
// STEP 1 of payment: create a Razorpay order for the current cart total
app.post('/api/payment/create-order', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate('cart.product');
        if (!user.cart || user.cart.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const totalAmount = user.cart
            .filter(item => item.product)
            .reduce((sum, item) => sum + item.product.price * item.qty, 0);

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(totalAmount * 100), // Razorpay uses paise, not rupees
            currency: 'INR',
            receipt: `receipt_${Date.now()}`
        });

        res.json({
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID // public key, safe to send to frontend
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// STEP 2 of payment: verify the payment actually succeeded, THEN create the real order
app.post('/api/payment/verify', verifyToken, async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            shippingAddress
        } = req.body;

        // Recreate the signature ourselves and compare — this is what proves
        // the payment response genuinely came from Razorpay, not a faked request.
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ error: 'Payment verification failed' });
        }

        // Payment is genuine — now actually create the order, same logic as before
        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone ||
            !shippingAddress.addressLine || !shippingAddress.city ||
            !shippingAddress.state || !shippingAddress.pincode) {
            return res.status(400).json({ error: 'Complete shipping address is required' });
        }

        const user = await User.findById(req.user.userId).populate('cart.product');
        const items = user.cart
            .filter(item => item.product)
            .map(item => ({
                product: item.product._id,
                name: item.product.name,
                price: item.product.price,
                qty: item.qty
            }));

        const totalAmount = items.reduce((sum, item) => sum + item.price * item.qty, 0);
        const expectedDelivery = new Date();
        expectedDelivery.setDate(expectedDelivery.getDate() + 5);

        const order = new Order({
            user: user._id,
            items,
            totalAmount,
            shippingAddress,
            expectedDelivery,
            status: 'confirmed' // payment succeeded, so skip 'pending'
        });
        await order.save();

        user.cart = [];
        await user.save();

        res.status(201).json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// GET the logged-in user's own order history
app.get('/api/orders', verifyToken, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET a single order by ID (only if it belongs to the logged-in user)
app.get('/api/orders/:id', verifyToken, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        if (order.user.toString() !== req.user.userId.toString()) {
            return res.status(403).json({ error: 'Not your order' });
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET a single product by ID (public — anyone should be able to view a product's detail page)
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /details — View all registered users (passwords excluded)
app.get('/details', verifyAdmin, async (req, res) => {
    try {
        const users = await User.find({}, { password: 0, __v: 0 });
        res.status(200).json({
            success: true,
            totalUsers: users.length,
            users,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /details/:id — View a single user by ID (password excluded)
app.get('/details/:id', verifyAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id, { password: 0, __v: 0 });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.status(200).json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /details/:id — Delete a user (this one is SUPPOSED to delete — admin-only user management)
app.delete('/details/:id', verifyAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// CREATE a new product
app.post('/api/products', verifyAdmin, async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

// UPDATE a product by ID
app.put('/api/products/:id', verifyAdmin, async (req, res) => {
    try {
        const updated = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { returnDocument: 'after' }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE a product by ID
app.delete('/api/products/:id', verifyAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// TEMPORARY — remove after use. Flips a user to admin for testing.
app.post('/api/dev/make-admin', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOneAndUpdate(
            { email },
            { isAdmin: true },
            { returnDocument: 'after' }
        );
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: `${user.email} is now an admin`, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
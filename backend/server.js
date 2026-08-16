require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Product = require('./models/Product');
const app = express();
const port = 3000;
const cors = require('cors');
app.use(cors());
app.use(express.json());
const { verifyToken, verifyAdmin } = require('./authMiddleware');

mongoose.connect('mongodb://localhost:27017/csmsilks')
    .then(() => console.log('Mongodb Connected'))
    .catch(err => console.log('MongoDB connection error:', err));

const JWT_SECRET = process.env.JWT_SECRET;
mongoose.connect(process.env.MONGO_URI)

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

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
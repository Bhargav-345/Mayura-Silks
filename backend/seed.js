const mongoose = require('mongoose');
const Product = require('./models/Product');

mongoose.connect('mongodb://localhost:27017/csmsilks')
    .then(async () => {
        console.log('MongoDB connected for sending');

        const products = [
            // index page itmes
            { name: 'Kanjivaram Silk Saree', price: 8500, image: 'images/sareesub1.webp', category: 'sarees', stock: 12 },
            { name: 'Banarasi Silk Saree', price: 15000, image: 'images/sareesub2.webp', category: 'sarees', stock: 8 },
            { name: 'Mysore Silk Saree', price: 8000, image: 'images/sareesub3.jpg', category: 'sarees', stock: 20 },
            { name: 'Patola Silk Saree', price: 5000, image: 'images/sareesub4.avif', category: 'sarees', stock: 15 },

            { name: 'Mysore Silk Saree', price: 2299, image: 'images/summersareepose.webp', category: 'Silk-sarees', stock: 4 },
            { name: 'Georgette Silk Saree', price: 1999, image: 'images/silk2.webp', category: 'Silk-sarees', stock: 8 },
            { name: 'Premium Silk Saree', price: 4999, image: 'images/saree4.webp', category: 'Silk-sarees', stock: 5 },
            { name: 'Cotton Silk Saree', price: 5000, image: 'images/banarasi.webp', category: 'Silk-sarees', stock: 15 },

            { name: 'Cotton lehenga', price: 2299, image: 'images/lehenga1.webp', category: 'Girls', stock: 5 },
            { name: 'Colorful lehenga', price: 2539, image: 'images/lehenga2.webp', category: 'Girls', stock: 15 },
            { name: 'Cotton Kurta', price: 3399, image: 'images/kurta.webp', category: 'Girls', stock: 3 },
            { name: 'Linen Lightweight', price: 2299, image: 'images/lehenga3.webp', category: 'Girls', stock: 8 },

            { name: 'Jeans and shirt', price: 2999, image: 'images/boy1.jpg', category: 'Boys', stock: 8 },
            { name: 'Pant and Shirt', price: 2539, image: 'images/boy2.avif', category: 'Boys', stock: 15 },
            { name: 'Full sleve shirt and Pant', price: 2599, image: 'images/boy3.jpg', category: 'Boys', stock: 7 },
            { name: 'Linen shirt and jeans', price: 2999, image: 'images/boy4.avif', category: 'Boys', stock: 5 },

            { name: 'Anarkali Kurta', price: 999, image: 'images/anarkalikurta.jpg', category: 'Kurtas', stock: 11 },
            { name: 'silk Kurta set', price: 899, image: 'images/silkkurta.jpg', category: 'Kurtas', stock: 9 },
            { name: 'Full sleve Kurta', price: 1999, image: 'images/sareesub4.avif', category: 'Kurtas', stock: 2 },
            { name: 'Classic Kurta', price: 1899, image: 'images/kurti.jpg', category: 'Kurtas', stock: 3 },

            // new_arrivals page items
            { name: 'Modern full sleve Kurta', price: 999, image: 'images/newwomen1.webp', category: 'new_arrival_women', stock: 5 },
            { name: 'silk Kurta set', price: 899, image: 'images/newwomen2.webp', category: 'new_arrival_women', stock: 6 },
            { name: 'Full sleve Kurta', price: 1999, image: 'images/newwoman3.webp', category: 'new_arrival_women', stock: 7 },
            { name: 'Classic Kurta', price: 1299, image: 'images/newwoman4.jpg', category: 'new_arrival_women', stock: 8 },

            { name: 'Classic Formals', price: 999, image: 'images/newmen1.jpg', category: 'new_arrival_men', stock: 4 },
            { name: 'Linen Shirt and Pant', price: 1099, image: 'images/newman2.jpg', category: 'new_arrival_men', stock: 10 },
            { name: 'Premium Jubba', price: 3999, image: 'images/newman3.jpg', category: 'new_arrival_men', stock: 9 },
            { name: 'Classic Jubba', price: 2599, image: 'images/newman4.jpg', category: 'new_arrival_men', stock: 9 },

            { name: 'Anarkali Kurta', price: 999, image: 'images/kids_girl1.webp', category: 'new_arrival_girl', stock: 15 },
            { name: 'silk Kurta set', price: 899, image: 'images/kids_girl2.webp', category: 'new_arrival_girl', stock: 9 },
            { name: 'Full sleve Kurta', price: 1999, image: 'images/kids_girl3.webp', category: 'new_arrival_girl', stock: 4 },
            { name: 'Classic Kurta', price: 1299, image: 'images/kids_girl4.webp', category: 'new_arrival_girl', stock: 3 },

            { name: 'Anarkali Kurta', price: 999, image: 'images/kids_boy.webp', category: 'new_arrival_boy', stock: 5 },
            { name: 'silk Kurta set', price: 899, image: 'images/kids_boy2.webp', category: 'new_arrival_boy', stock: 16 },
            { name: 'Full sleve Kurta', price: 1999, image: 'images/kids_boy3.webp', category: 'new_arrival_boy', stock: 5 },
            { name: 'Classic Kurta', price: 1299, image: 'images/kids_boy4.webp', category: 'new_arrival_boy', stock: 15 }
        ];

        await Product.deleteMany({});
        await Product.insertMany(products);
        console.log('Products seeded successfully');
        mongoose.connection.close(); // done, disconnect
    })
    .catch(err => console.log('Error:', err));



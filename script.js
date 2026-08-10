// //script.js
// // Initialize cart
// let cart = JSON.parse(localStorage.getItem('scm_cart')) || [];

// function updateCartCount() {
//     const countElement = document.getElementById('cart-count');
//     if (countElement) {
//         countElement.textContent = cart.length;
//     }
//     let cart_store = cart.length;
// }

// function addToCart(product) {
//     const existing = cart.find(item => item.name === product.name);
//     if (existing) {
//         existing.qty = (existing.qty || 1) + 1;
//     } else {
//         product.qty = 1;
//         cart.push(product);
//     }
//     localStorage.setItem('scm_cart', JSON.stringify(cart));
//     updateCartCount();
// }

// const buyButtons = document.querySelectorAll('.buy');

// buyButtons.forEach(button => {
//     button.addEventListener('click', function () {
//         const product = {
//             name: this.getAttribute('data-name'),
//             price: parseFloat(this.getAttribute('data-price')),
//             image: this.getAttribute('data-image')
//         };

//         addToCart(product);
//         alert(product.name + ' added to cart! (' + cart.length + ' items)');

//     });
// });

// updateCartCount();

// // wish//
// let wish = JSON.parse(localStorage.getItem('scm_wish')) || [];

// function updatewishcount() {
//     const count = document.getElementById('wish-count')
//     if (count) {
//         count.textContent = wish.length;
//     }
// }

// function addToWish(productdetails) {
//     const exists = wish.some(item => item.name === productdetails.name);
//     if (!exists) {
//         wish.push(productdetails);
//         localStorage.setItem('scm_wish', JSON.stringify(wish));
//         updatewishcount();
//     }
// }

// const wishbuttons = document.querySelectorAll('.wish');

// wishbuttons.forEach(button => {
//     button.addEventListener('click', function () {
//         const productdetails = {
//             name: this.getAttribute('data-name'),
//             price: parseFloat(this.getAttribute('data-price')),
//             image: this.getAttribute('data-image')
//         };

//         addToWish(productdetails);
//         alert(productdetails.name + 'added to wishlist (' + wish.length + 'items)');
//     });
// });

// updatewishcount();

// function updateNavbarAuth() {
//     const authLink = document.querySelector('a[href="auth.html"]');
//     if (!authLink) return;

//     const user = JSON.parse(localStorage.getItem('scm_user'));

//     if (user) {
//         authLink.innerHTML = `<i class="fa-regular fa-circle-user"></i>${user.name}`;
//         authLink.href = '#';
//         authLink.onclick = (e) => {
//             e.preventDefault();
//             if (confirm('Log out?')) {
//                 localStorage.removeItem('scm_token');
//                 localStorage.removeItem('scm_user');
//                 window.location.href = 'index.html';
//             }
//         };
//     } else {
//         authLink.innerHTML = `<i class="fa-regular fa-circle-user"></i>Login | Sign Up`;
//         authLink.href = 'auth.html';
//     }
// }

// updateNavbarAuth();

// async function loadProducts(category, containerId) {
//     const container = document.getElementById(containerId);
//     try {
//         const res = await fetch(`http://localhost:3000/api/products?category=${category}`);
//         const products = await res.json();

//         if (products.length === 0) {
//             container.innerHTML = `<p>No products found in ${category}.</p>`;
//             return;
//         }

//         container.innerHTML = products.map(p => `
//             <div class="img-cont">
//                 <a href="${p.image}" data-lightbox="${category}" data-title="${p.name} ₹${p.price}">
//                     <img src="${p.image}" class="product-img" alt="${p.name}">
//                 </a>
//                 <p>&#8377;${p.price}.00 ${p.name}</p>
//                 <div class="wish_buy_cont">
//                     <button class="wish" data-id="${p._id}" data-name="${p.name}" data-price="${p.price}" data-image="${p.image}">
//                         <i class="fa-solid fa-heart"></i>
//                     </button>
//                     <button class="buy" data-id="${p._id}" data-name="${p.name}" data-price="${p.price}" data-image="${p.image}">
//                         <i class="fa-solid fa-cart-arrow-down"></i>
//                     </button>
//                 </div>
//             </div>
//         `).join('');

//     } catch (err) {
//         container.innerHTML = `<p>Couldn't load ${category}. Is the backend running?</p>`;
//         console.error(err);
//     }
// }

// loadProducts('sarees', 'sarees-container');
// loadProducts('Silk-sarees', 'Silks-container');
// loadProducts('Girls', 'Girls-container');
// loadProducts('Boys', 'Boys-container');
// loadProducts('Kurtas', 'Kurtas-container');
// loadProducts('new_arrival_women', 'new_arrival_women-container');
// loadProducts('new_arrival_men', 'new_arrival_men-container');
// loadProducts('new_arrival_girl', 'new_arrival_girl-container');
// loadProducts('new_arrival_boy', 'new_arrival_boy-container');


// document.getElementById('content2').addEventListener('click', function (e) {
//     const btn = e.target.closest('button');
//     if (!btn) return;

//     const product = {
//         name: btn.getAttribute('data-name'),
//         price: parseFloat(btn.getAttribute('data-price')),
//         image: btn.getAttribute('data-image')
//     };

//     if (btn.classList.contains('buy')) {
//         addToCart(product);
//         alert(product.name + ' added to cart! (' + cart.length + ' items)');
//     }

//     if (btn.classList.contains('wish')) {
//         addToWish(product);
//         alert(product.name + ' added to wishlist (' + wish.length + ' items)');
//     }
// });


// // scroller
// document.querySelectorAll('.scroll-section').forEach(section => {
//     const container = section.querySelector('.scroll-container');
//     const leftBtn = section.querySelector('.scroll-arrow.left');
//     const rightBtn = section.querySelector('.scroll-arrow.right');

//     leftBtn.addEventListener('click', () => {
//         container.scrollBy({ left: -100, behavior: 'smooth' });
//     });

//     rightBtn.addEventListener('click', () => {
//         container.scrollBy({ left: 100, behavior: 'smooth' });
//     });
// });


// ── AUTH HELPERS ──
function getToken() {
    return localStorage.getItem('scm_token');
}

function requireLogin() {
    const token = getToken();
    if (!token) {
        alert('Please login to continue.');
        window.location.href = 'auth.html';
        return false;
    }
    return true;
}

// ── CART COUNT (fetched from API, not localStorage) ──
async function updateCartCount() {
    const countElement = document.getElementById('cart-count');
    if (!countElement) return;

    const token = getToken();
    if (!token) {
        countElement.textContent = 0;
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/api/cart', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) { countElement.textContent = 0; return; }
        const cart = await res.json();
        const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
        countElement.textContent = totalQty;
    } catch (err) {
        console.error(err);
    }
}

// ── WISHLIST COUNT ──
async function updatewishcount() {
    const countElement = document.getElementById('wish-count');
    if (!countElement) return;

    const token = getToken();
    if (!token) {
        countElement.textContent = 0;
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/api/wishlist', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) { countElement.textContent = 0; return; }
        const wishlist = await res.json();
        countElement.textContent = wishlist.length;
    } catch (err) {
        console.error(err);
    }
}

// ── ADD TO CART (calls API, not localStorage) ──
async function addToCart(productId, name) {
    if (!requireLogin()) return;

    try {
        const res = await fetch('http://localhost:3000/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getToken()}`
            },
            body: JSON.stringify({ productId, qty: 1 })
        });

        const data = await res.json();
        if (!res.ok) {
            alert(data.error || 'Could not add to cart');
            return;
        }

        alert(name + ' added to cart!');
        updateCartCount();
    } catch (err) {
        console.error(err);
        alert('Could not reach the server.');
    }
}

// ── ADD TO WISHLIST (calls API, not localStorage) ──
async function addToWish(productId, name) {
    if (!requireLogin()) return;

    try {
        const res = await fetch('http://localhost:3000/api/wishlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getToken()}`
            },
            body: JSON.stringify({ productId })
        });

        const data = await res.json();
        if (!res.ok) {
            alert(data.error || 'Could not add to wishlist');
            return;
        }

        alert(name + ' added to wishlist!');
        updatewishcount();
    } catch (err) {
        console.error(err);
        alert('Could not reach the server.');
    }
}

updateCartCount();
updatewishcount();

// ── NAVBAR AUTH STATE ──
function updateNavbarAuth() {
    const authLink = document.querySelector('a[href="auth.html"]');
    if (!authLink) return;

    const user = JSON.parse(localStorage.getItem('scm_user'));

    if (user) {
        authLink.innerHTML = `<i class="fa-regular fa-circle-user"></i>${user.name}`;
        authLink.href = '#';
        authLink.onclick = (e) => {
            e.preventDefault();
            if (confirm('Log out?')) {
                localStorage.removeItem('scm_token');
                localStorage.removeItem('scm_user');
                window.location.href = 'index.html';
            }
        };
    } else {
        authLink.innerHTML = `<i class="fa-regular fa-circle-user"></i>Login | Sign Up`;
        authLink.href = 'auth.html';
    }
}

updateNavbarAuth();

// ── LOAD PRODUCTS (unchanged, just confirming it stays) ──
async function loadProducts(category, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const res = await fetch(`http://localhost:3000/api/products?category=${category}`);
        const products = await res.json();

        if (!Array.isArray(products) || products.length === 0) {
            container.innerHTML = `<p>No products found in ${category}.</p>`;
            return;
        }

        container.innerHTML = products.map(p => `
            <div class="img-cont">
                <a href="${p.image}" data-lightbox="${category}" data-title="${p.name} ₹${p.price}">
                    <img src="${p.image}" class="product-img" alt="${p.name}">
                </a>
                <p>&#8377;${p.price}.00 ${p.name}</p>
                <div class="wish_buy_cont">
                    <button class="wish" data-id="${p._id}" data-name="${p.name}">
                        <i class="fa-solid fa-heart"></i>
                    </button>
                    <button class="buy" data-id="${p._id}" data-name="${p.name}">
                        <i class="fa-solid fa-cart-arrow-down"></i>
                    </button>
                </div>
            </div>
        `).join('');

    } catch (err) {
        container.innerHTML = `<p>Couldn't load ${category}. Is the backend running?</p>`;
        console.error(err);
    }
}

loadProducts('sarees', 'sarees-container');
loadProducts('Silk-sarees', 'Silks-container');
loadProducts('Girls', 'Girls-container');
loadProducts('Boys', 'Boys-container');
loadProducts('Kurtas', 'Kurtas-container');
// loadProducts('new_arrival_women', 'new_arrival_women-container');
// loadProducts('new_arrival_men', 'new_arrival_men-container');
// loadProducts('new_arrival_girl', 'new_arrival_girl-container');
// loadProducts('new_arrival_boy', 'new_arrival_boy-container');

// ── CLICK HANDLER (now reads data-id, calls API functions) ──
const content2 = document.getElementById('content2');
if (content2) {
    content2.addEventListener('click', function (e) {
        const btn = e.target.closest('button');
        if (!btn) return;

        const productId = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');

        if (btn.classList.contains('buy')) {
            addToCart(productId, name);
        }
        if (btn.classList.contains('wish')) {
            addToWish(productId, name);
        }
    });
}

// ── SCROLLER ──
document.querySelectorAll('.scroll-section').forEach(section => {
    const container = section.querySelector('.scroll-container');
    const leftBtn = section.querySelector('.scroll-arrow.left');
    const rightBtn = section.querySelector('.scroll-arrow.right');
    if (!container || !leftBtn || !rightBtn) return;

    leftBtn.addEventListener('click', () => container.scrollBy({ left: -100, behavior: 'smooth' }));
    rightBtn.addEventListener('click', () => container.scrollBy({ left: 100, behavior: 'smooth' }));
});
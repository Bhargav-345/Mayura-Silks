//categories.js

// MOBILE SIDEBAR MENU (hamburger in second_layer)

document.addEventListener('DOMContentLoaded', function () {
    const hamburgerBtn = document.querySelector('.hamburger');
    const thirdLayer = document.getElementById('third_layer');
    const backdrop = document.getElementById('menu-backdrop');
    const hamburgerIcon = hamburgerBtn.querySelector('i');

    function openMobileMenu() {
        thirdLayer.classList.add('active');
        backdrop.classList.add('active');
        hamburgerIcon.classList.remove('fa-bars');
        hamburgerIcon.classList.add('fa-xmark');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
        thirdLayer.classList.remove('active');
        backdrop.classList.remove('active');
        hamburgerIcon.classList.remove('fa-xmark');
        hamburgerIcon.classList.add('fa-bars');
        document.body.style.overflow = '';
    }

    hamburgerBtn.addEventListener('click', function () {

        if (thirdLayer.classList.contains('active')) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });

    backdrop.addEventListener('click', closeMobileMenu);

    // Tapping a category link navigates to its page - just close the sidebar first
    thirdLayer.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
});


document.querySelectorAll('.category_scroll-section').forEach(section => {
    const container = section.querySelector('.category_cont');
    const leftBtn = section.querySelector('.scroll-arrow.left');
    const rightBtn = section.querySelector('.scroll-arrow.right');

    leftBtn.addEventListener('click', () => {
        container.scrollBy({ left: -100, behavior: 'smooth' });
    });

    rightBtn.addEventListener('click', () => {
        container.scrollBy({ left: 100, behavior: 'smooth' }); `m `
    });
});

// products
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
                    <button class="wish" data-id="${p._id}" data-name="${p.name}" data-price="${p.price}" data-image="${p.image}">
                        <i class="fa-solid fa-heart"></i>
                    </button>
                    <button class="buy" data-id="${p._id}" data-name="${p.name}" data-price="${p.price}" data-image="${p.image}">
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

loadProducts('new_arrival_women', 'new_arrival_women-container');
loadProducts('new_arrival_men', 'new_arrival_men-container');
loadProducts('new_arrival_girl', 'new_arrival_girl-container');
loadProducts('new_arrival_boy', 'new_arrival_boy-container');
loadProducts('sarees', 'sarees-container');
loadProducts('Silk-sarees', 'Silks-container');
loadProducts('Girls', 'Girls-container');

document.getElementById('contents').addEventListener('click', function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    const product = {
        name: btn.getAttribute('data-name'),
        price: parseFloat(btn.getAttribute('data-price')),
        image: btn.getAttribute('data-image')
    };

    if (btn.classList.contains('buy')) {
        addToCart(product);
        alert(product.name + ' added to cart! (' + cart.length + ' items)');
    }

    if (btn.classList.contains('wish')) {
        addToWish(product);
        alert(product.name + ' added to wishlist (' + wish.length + ' items)');
    }
});

// hamburger
document.addEventListener('DOMContentLoaded', function () {
    const hamburgerBtn = document.querySelector('.hamburger');
    const thirdLayer = document.getElementById('third_layer');
    const backdrop = document.getElementById('menu-backdrop');
    const hamburgerIcon = hamburgerBtn.querySelector('i');

    function openMobileMenu() {
        thirdLayer.classList.add('active');
        backdrop.classList.add('active');
        hamburgerIcon.classList.remove('fa-bars');
        hamburgerIcon.classList.add('fa-xmark');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
        thirdLayer.classList.remove('active');
        backdrop.classList.remove('active');
        hamburgerIcon.classList.remove('fa-xmark');
        hamburgerIcon.classList.add('fa-bars');
        document.body.style.overflow = '';
    }

    hamburgerBtn.addEventListener('click', function () {

        if (thirdLayer.classList.contains('active')) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });

    backdrop.addEventListener('click', closeMobileMenu);

    // Tapping a category link navigates to its page - just close the sidebar first
    thirdLayer.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
});

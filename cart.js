//cart.js
document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('scm_token');
    let cards_container = document.getElementById('cards-cont');

    if (!token) {
        alert('Please login to view your cart.');
        window.location.href = 'auth.html';
        return;
    }

    let cartItems = [];

    try {
        const res = await fetch('http://localhost:3000/api/cart', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            // Stale/invalid token — force a clean re-login instead of showing a broken page.
            localStorage.removeItem('scm_token');
            localStorage.removeItem('scm_user');
            alert(data.error || 'Your session has expired. Please log in again.');
            window.location.href = 'auth.html';
            return;
        }

        cartItems = await res.json();
    } catch (err) {
        cards_container.innerHTML = "<h1>Couldn't load your cart. Is the backend running?</h1>";
        console.error(err);
        return;
    }

    if (!cartItems || cartItems.length === 0) {
        cards_container.innerHTML = "<h1>Your cart is empty!</h1>";
        return;
    }

    function calculateTotal() {
        let total = 0, itemCount = 0;
        const allQuantInputs = cards_container.querySelectorAll('input[type="number"]');
        allQuantInputs.forEach((input, index) => {
            const qty = parseInt(input.value);
            itemCount += qty;
            total += cartItems[index].product.price * qty;
        });
        document.getElementById('subtotal').textContent = '₹' + total;
        document.getElementById('total-amount').textContent = '₹' + total;
        document.getElementById('item-count').textContent = itemCount;
        return total;
    }

    async function updateQtyOnServer(productId, qty) {
        const res = await fetch(`http://localhost:3000/api/cart/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ qty })
        });
        return res.ok;
    }

    async function removeFromServer(productId) {
        const res = await fetch(`http://localhost:3000/api/cart/${productId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.ok;
    }

    cartItems.forEach((item, index) => {
        const p = item.product; // populated product details
        if (!p) return; // skip broken entries pointing at deleted products

        const card = document.createElement('div');
        card.className = 'carts-card';

        const imgwrap = document.createElement('div');
        imgwrap.className = 'img_wrapper';
        const a = document.createElement('a');
        a.href = p.image;
        a.setAttribute('data-lightbox', 'cart');
        a.setAttribute('data-title', p.name + ' - ₹' + p.price);
        const img = document.createElement('img');
        img.src = p.image;
        a.appendChild(img);
        imgwrap.appendChild(a);

        const details = document.createElement('div');
        details.className = 'cart-details';
        const name = document.createElement('p');
        name.textContent = p.name;
        const price = document.createElement('p');
        price.className = 'cart-price';
        price.textContent = '₹' + p.price;
        const delivery = document.createElement('p');
        delivery.style.fontSize = '0.85rem';
        delivery.style.color = '#27ae60';
        delivery.textContent = 'FREE Delivery';
        details.appendChild(name);
        details.appendChild(price);
        details.appendChild(delivery);

        const actions = document.createElement('div');
        actions.className = 'quant_total';
        const quant = document.createElement('input');
        quant.type = 'number';
        quant.value = item.qty || 1;
        quant.min = 1;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i> Remove';

        removeBtn.addEventListener('click', async function () {
            const success = await removeFromServer(p._id);
            if (!success) {
                alert('Could not remove item. Please try again.');
                return; // don't touch the UI if the server didn't actually update
            }
            cartItems.splice(index, 1);
            card.remove();
            calculateTotal();
            updateCartCount(); // refresh navbar badge (defined in script.js)
            if (cartItems.length === 0) {
                cards_container.innerHTML = "<h1>Your cart is empty!</h1>";
            }
        });

        quant.addEventListener('change', async function () {
            const qty = parseInt(this.value);
            if (qty < 1) { this.value = 1; return; }
            item.qty = qty;
            const success = await updateQtyOnServer(p._id, qty);
            if (!success) {
                alert('Could not update quantity. Please try again.');
                return;
            }
            price.textContent = '₹' + (p.price * qty);
            calculateTotal();
            updateCartCount();
        });

        actions.appendChild(quant);
        actions.appendChild(removeBtn);
        card.appendChild(imgwrap);
        card.appendChild(details);
        card.appendChild(actions);
        cards_container.appendChild(card);
    });

    calculateTotal();

    //order now code
    const placeOrderBtn = document.getElementById('place_order');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', function () {
            if (cartItems.length === 0) {
                alert('Your cart is empty.');
                return;
            }
            window.location.href = 'checkout.html';
        });
    }
});
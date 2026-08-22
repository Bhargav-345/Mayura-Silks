// checkout.js
// ── CART COUNT (fetched from API) ──
async function updateCartCount() {
    const countElement = document.getElementById('cart-count');
    if (!countElement) return;

    const token = getToken();
    if (!token) {
        countElement.textContent = 0;
        return;
    }

    try {
        const res = await fetch('https://csm-silks.onrender.com/api/cart', {
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
        const res = await fetch('https://csm-silks.onrender.com/api/wishlist', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) { countElement.textContent = 0; return; }
        const wishlist = await res.json();
        countElement.textContent = wishlist.length;
    } catch (err) {
        console.error(err);
    }
}

updateCartCount();
updatewishcount();

document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('scm_token');
    const summaryItems = document.getElementById('summary-items');
    const summaryTotal = document.getElementById('summary-total');
    const deliveryDateEl = document.getElementById('delivery-date');
    const payBtn = document.getElementById('pay-now-btn');

    if (!token) {
        alert('Please login to continue to checkout.');
        window.location.href = 'auth.html';
        return;
    }

    // Show a simple delivery estimate: today + 5 days
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    deliveryDateEl.textContent = deliveryDate.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long'
    });

    // Load the current cart to show a summary (order is created only after payment succeeds)
    let cartItems = [];
    try {
        const res = await fetch('https://csm-silks.onrender.com/api/cart', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Could not load cart');
        cartItems = await res.json();
    } catch (err) {
        summaryItems.innerHTML = '<p>Could not load your cart.</p>';
        console.error(err);
        return;
    }

    if (!cartItems || cartItems.length === 0) {
        summaryItems.innerHTML = '<p>Your cart is empty.</p>';
        payBtn.disabled = true;
        return;
    }

    let total = 0;
    summaryItems.innerHTML = cartItems
        .filter(item => item.product)
        .map(item => {
            const lineTotal = item.product.price * item.qty;
            total += lineTotal;
            return `<div class="summary-row"><span>${item.product.name} × ${item.qty}</span><span>₹${lineTotal}</span></div>`;
        })
        .join('');
    summaryTotal.textContent = '₹' + total;

    payBtn.addEventListener('click', async function () {
        const fullName = document.getElementById('fullName').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const addressLine = document.getElementById('addressLine').value.trim();
        const city = document.getElementById('city').value.trim();
        const state = document.getElementById('state').value.trim();
        const pincode = document.getElementById('pincode').value.trim();

        if (!fullName || !phone || !addressLine || !city || !state || !pincode) {
            alert('Please fill in all delivery details.');
            return;
        }

        const shippingAddress = { fullName, phone, addressLine, city, state, pincode };

        payBtn.disabled = true;
        payBtn.textContent = 'Preparing payment...';

        try {
            // STEP 1: ask backend to create a Razorpay order for the cart total
            const createRes = await fetch('https://csm-silks.onrender.com/api/payment/create-order', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const createData = await createRes.json();

            if (!createRes.ok) {
                alert(createData.error || 'Could not start payment');
                payBtn.disabled = false;
                payBtn.textContent = 'Pay Now →';
                return;
            }

            // STEP 2: open Razorpay's checkout modal with that order
            const options = {
                key: createData.keyId,
                amount: createData.amount,
                currency: createData.currency,
                name: 'Mayura Silks',
                description: 'Order Payment',
                order_id: createData.razorpayOrderId,
                handler: async function (response) {
                    // STEP 3: payment succeeded on Razorpay's side — verify it server-side
                    // and only then actually create the order in our database.
                    payBtn.textContent = 'Verifying payment...';

                    try {
                        const verifyRes = await fetch('https://csm-silks.onrender.com/api/payment/verify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                shippingAddress
                            })
                        });

                        const verifyData = await verifyRes.json();

                        if (!verifyRes.ok) {
                            alert(verifyData.error || 'Payment verification failed');
                            payBtn.disabled = false;
                            payBtn.textContent = 'Pay Now →';
                            return;
                        }

                        alert('Payment successful! Order placed. Expected delivery: ' + deliveryDateEl.textContent);
                        window.location.href = 'index.html';
                    } catch (err) {
                        console.error(err);
                        alert('Payment succeeded but order confirmation failed. Please contact support.');
                    }
                },
                modal: {
                    ondismiss: function () {
                        // User closed the Razorpay popup without paying
                        payBtn.disabled = false;
                        payBtn.textContent = 'Pay Now →';
                    }
                },
                prefill: {
                    name: fullName,
                    contact: phone
                },
                theme: { color: '#9acd32' }
            };

            const rzp = new Razorpay(options);
            rzp.open();
            payBtn.textContent = 'Pay Now →';
            payBtn.disabled = false;
        } catch (err) {
            console.error(err);
            alert('Could not reach the server.');
            payBtn.disabled = false;
            payBtn.textContent = 'Pay Now →';
        }
    });
});
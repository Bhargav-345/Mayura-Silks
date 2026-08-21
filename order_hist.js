// orders.js
document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('scm_token');
    const ordersList = document.getElementById('orders-list');

    if (!token) {
        alert('Please login to view your orders.');
        window.location.href = 'auth.html';
        return;
    }

    let orders = [];
    try {
        const res = await fetch('https://csm-silks.onrender.com/api/orders', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            localStorage.removeItem('scm_token');
            localStorage.removeItem('scm_user');
            alert(data.error || 'Your session has expired. Please log in again.');
            window.location.href = 'auth.html';
            return;
        }

        orders = await res.json();
    } catch (err) {
        ordersList.innerHTML = '<p id="no-orders">Could not load your orders. Is the backend running?</p>';
        console.error(err);
        return;
    }

    if (!orders || orders.length === 0) {
        ordersList.innerHTML = `
            <div id="no-orders">
                <h2>No orders yet</h2>
                <p>Everything you order will show up here.</p>
            </div>
        `;
        return;
    }

    ordersList.innerHTML = orders.map(order => {
        const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        const deliveryDate = new Date(order.expectedDelivery).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long'
        });

        const itemsHtml = order.items.map(item => `
            <div class="order-item-row">
                <span>${item.name} × ${item.qty}</span>
                <span>₹${item.price * item.qty}</span>
            </div>
        `).join('');

        const addr = order.shippingAddress;
        const addressHtml = addr
            ? `Delivering to: ${addr.fullName}, ${addr.addressLine}, ${addr.city}, ${addr.state} - ${addr.pincode}`
            : '';

        return `
            <div class="order-card">
                <div class="order-header">
                    <span class="order-id">Order #${order._id.slice(-8).toUpperCase()} · ${orderDate}</span>
                    <span class="order-status status-${order.status}">${order.status}</span>
                </div>
                <div class="order-items">${itemsHtml}</div>
                <div class="order-address">${addressHtml}</div>
                <div class="order-footer">
                    <span class="order-delivery">📦 Expected delivery: ${deliveryDate}</span>
                    <span class="order-total">₹${order.totalAmount}</span>
                </div>
            </div>
        `;
    }).join('');
});
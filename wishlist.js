// //wishlist.js
// document.addEventListener('DOMContentLoaded', function () {
//     let created_list = JSON.parse(localStorage.getItem('scm_wish'));
//     let wish_container = document.getElementById('wishlist_content');
//     let cards_cont = document.getElementById('cards-cont')

//     if (!created_list || created_list.length === 0) {
//         wish_container.innerHTML = '<h1> Your wishlist is empty...! </h1>';
//         cards_cont.style.display = "none";
//         return;
//     }
//     created_list.forEach((item, index) => {
//         const card = document.createElement('div');
//         card.className = 'wish-cards';

//         const imgwrap = document.createElement('div');
//         imgwrap.className = 'img_wrapper';

//         const a = document.createElement('a');
//         a.href = item.image;
//         a.setAttribute('data-lightbox', 'wish');
//         a.setAttribute('data-title', item.name + ' - ₹' + item.price);

//         const img = document.createElement('img');
//         img.src = item.image;

//         a.appendChild(img);
//         imgwrap.appendChild(a);

//         //Product details
//         const details = document.createElement('div');
//         details.className = 'product_details';

//         const name = document.createElement('p');
//         name.textContent = item.name;

//         const price = document.createElement('p');
//         price.className = 'product_price';
//         price.textContent = '₹' + item.price;

//         //remove btn
//         const removebtn = document.createElement('button');
//         removebtn.className = 'remove-btn';
//         removebtn.innerHTML = '<i class="fa-solid fa-trash"></i> Remove';

//         removebtn.addEventListener('click', function () {
//             created_list.splice(index, 1);
//             localStorage.setItem('scm_wish', JSON.stringify(created_list));

//             card.remove();

//             if (created_list.length === 0) {
//                 wish_container.innerHTML = "<h1>Your Wishlist is empty...!</h1>";
//             }
//         })
//         details.appendChild(name);
//         details.appendChild(price);
//         details.appendChild(removebtn);

//         card.appendChild(imgwrap);
//         card.appendChild(details);
//         cards_cont.appendChild(card)
//     });
//     wish_container.appendChild(cards_cont);
// })


document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('scm_token');
    let wish_container = document.getElementById('wishlist_content');
    let cards_cont = document.getElementById('cards-cont');

    if (!token) {
        alert('Please login to view your wishlist.');
        window.location.href = 'auth.html';
        return;
    }

    let wishlist = [];
    try {
        const res = await fetch('http://localhost:3000/api/wishlist', {
            headers: { Authorization: `Bearer ${token}` }
        });
        wishlist = await res.json();
    } catch (err) {
        wish_container.innerHTML = "<h1>Couldn't load your wishlist.</h1>";
        console.error(err);
        return;
    }

    if (!wishlist || wishlist.length === 0) {
        wish_container.innerHTML = '<h1>Your wishlist is empty...!</h1>';
        cards_cont.style.display = "none";
        return;
    }

    wishlist.forEach((item, index) => {
        if (!item) return; // skip entries pointing at deleted products

        const card = document.createElement('div');
        card.className = 'wish-cards';

        const imgwrap = document.createElement('div');
        imgwrap.className = 'img_wrapper';
        const a = document.createElement('a');
        a.href = item.image;
        a.setAttribute('data-lightbox', 'wish');
        a.setAttribute('data-title', item.name + ' - ₹' + item.price);
        const img = document.createElement('img');
        img.src = item.image;
        a.appendChild(img);
        imgwrap.appendChild(a);

        const details = document.createElement('div');
        details.className = 'product_details';
        const name = document.createElement('p');
        name.textContent = item.name;
        const price = document.createElement('p');
        price.className = 'product_price';
        price.textContent = '₹' + item.price;

        const removebtn = document.createElement('button');
        removebtn.className = 'remove-btn';
        removebtn.innerHTML = '<i class="fa-solid fa-trash"></i> Remove';

        removebtn.addEventListener('click', async function () {
            await fetch(`http://localhost:3000/api/wishlist/${item._id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            card.remove();
            updatewishcount();
            wishlist.splice(index, 1);
            if (wishlist.length === 0) {
                wish_container.innerHTML = "<h1>Your Wishlist is empty...!</h1>";
                cards_cont.style.display = "none";
            }
        });

        details.appendChild(name);
        details.appendChild(price);
        details.appendChild(removebtn);
        card.appendChild(imgwrap);
        card.appendChild(details);
        cards_cont.appendChild(card);
    });
});
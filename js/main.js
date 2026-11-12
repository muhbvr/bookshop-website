// cart data
let cart = [];


function saveCart() {
    sessionStorage.setItem("bookCart", JSON.stringify(cart));
}

function loadCart() {
    const savedCart = sessionStorage.getItem("bookCart");

    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

function getTotal() {
    let total = 0;

    cart.forEach(function(item) {
        total += item.price;
    });

    return total;
}


// update cart ui
function updateCart() {

    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");
    const checkoutBtn = document.getElementById("checkoutBtn");

    if (!cartItems) return;

    // nothing added yet
    if (cart.length === 0) {

        cartItems.innerHTML = "No books selected";
        cartTotal.innerHTML = "Total: $0.00";

        if (checkoutBtn) {
            checkoutBtn.disabled = true;
        }

        return;
    }

    let html = "";

    cart.forEach(function(book) {

        html += `
            <div class="cart-item">
                ${book.title} - $${book.price.toFixed(2)}
                <button class="remove-item" data-id="${book.id}">
                    ✖
                </button>
            </div>
        `;
    });

    cartItems.innerHTML = html;
    cartTotal.innerHTML = `Total: $${getTotal().toFixed(2)}`;

    if (checkoutBtn) {
        checkoutBtn.disabled = false;
    }

    // remove item buttons
    const removeBtns = document.querySelectorAll(".remove-item");

    removeBtns.forEach(function(btn) {

        btn.addEventListener("click", function() {

            const id = Number(this.dataset.id);

            cart = cart.filter(function(book) {
                return book.id !== id;
            });

            saveCart();
            updateCart();
        });
    });
}


// mobile nav
function initHamburgerMenu() {

    const hamburger = document.getElementById("hamburger");
    const navMenu = document.getElementById("navMenu");

    if (!hamburger || !navMenu) return;

    hamburger.addEventListener("click", function() {

        navMenu.classList.toggle("active");
    });
}


// homepage stuff
if (document.querySelector(".books-grid")) {

    loadCart();
    updateCart();

    const bookCards = document.querySelectorAll(".book-card");

    bookCards.forEach(function(card) {

        const id = Number(card.dataset.id);
        const title = card.dataset.title;
        const price = Number(card.dataset.price);

        const payBtn = card.querySelector(".btn-pay");

        // create add to cart button
        const addBtn = document.createElement("button");

        addBtn.className = "btn-add-cart";
        addBtn.textContent = "+ Add to Cart";

        if (payBtn) {
            payBtn.parentElement.appendChild(addBtn);
        }

        // add to cart
        addBtn.addEventListener("click", function(e) {

            e.stopPropagation();

            const alreadyAdded = cart.some(function(book) {
                return book.id === id;
            });

            if (alreadyAdded) {
                alert("Already in cart");
                return;
            }

            cart.push({
                id: id,
                title: title,
                price: price
            });

            saveCart();
            updateCart();

            alert(title + " added to cart!");
        });

        // buy now
        if (payBtn) {

            payBtn.addEventListener("click", function() {

                cart = [{
                    id: id,
                    title: title,
                    price: price
                }];

                saveCart();

                window.location.href = "pay.html";
            });
        }
    });

    const checkoutBtn = document.getElementById("checkoutBtn");

    if (checkoutBtn) {

        checkoutBtn.addEventListener("click", function() {
            window.location.href = "pay.html";
        });
    }

    initHamburgerMenu();
}


// payment page
if (document.getElementById("paymentForm")) {

    loadCart();

    const orderItems = document.getElementById("orderItems");
    const orderTotal = document.getElementById("orderTotal");

    // show order summary
    if (orderItems) {

        if (cart.length === 0) {

            orderItems.innerHTML = `
                <p>
                    No items selected.
                    <a href="index.html">Go back to shop</a>
                </p>
            `;

        } else {

            let itemsHtml = "";

            cart.forEach(function(book) {

                itemsHtml += `
                    <p>
                        ${book.title} - $${book.price.toFixed(2)}
                    </p>
                `;
            });

            orderItems.innerHTML = itemsHtml;
            orderTotal.innerHTML = `
                <strong>
                    Total: $${getTotal().toFixed(2)}
                </strong>
            `;
        }
    }


    // mastercard only
    function validateCardNumber(number) {

        const clean = number.replace(/\s/g, "");

        if (!/^\d{16}$/.test(clean)) {
            return false;
        }

        const prefix = Number(clean.substring(0, 2));

        return prefix >= 51 && prefix <= 55;
    }


    function validateExpiry(year, month) {

        const today = new Date();

        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;

        if (year < currentYear) return false;

        if (year === currentYear && month < currentMonth) {
            return false;
        }

        return true;
    }


    function validateCVV(cvv) {

        return /^\d{3,4}$/.test(cvv);
    }


    const form = document.getElementById("paymentForm");
    const spinner = document.getElementById("loadingSpinner");
    const paymentStatus = document.getElementById("paymentStatus");


    form.addEventListener("submit", function(e) {

        e.preventDefault();

        // clear old errors
        document.querySelectorAll(".error-message")
            .forEach(function(error) {
                error.textContent = "";
            });

        const cardNumber = document.getElementById("cardNumber").value;
        const expMonth = Number(document.getElementById("expiryMonth").value);
        const expYear = Number(document.getElementById("expiryYear").value);
        const cvv = document.getElementById("cvv").value;

        let valid = true;

        // card validation
        if (!validateCardNumber(cardNumber)) {

            document.getElementById("cardError").textContent =
                "Invalid Mastercard number";

            valid = false;
        }

        // month
        if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) {

            document.getElementById("monthError").textContent =
                "Enter valid month";

            valid = false;
        }

        // year
        if (isNaN(expYear) || expYear < 2025) {

            document.getElementById("yearError").textContent =
                "Enter valid year";

            valid = false;

        } else if (!validateExpiry(expYear, expMonth)) {

            document.getElementById("yearError").textContent =
                "Card has expired";

            valid = false;
        }

        // cvv
        if (!validateCVV(cvv)) {

            document.getElementById("cvvError").textContent =
                "CVV must be 3 or 4 digits";

            valid = false;
        }

        if (!valid) return;


        const cleanNumber = cardNumber.replace(/\s/g, "");

        const payload = {
            master_card: Number(cleanNumber),
            exp_year: expYear,
            exp_month: expMonth,
            cvv_code: cvv
        };

        spinner.style.display = "block";
        paymentStatus.innerHTML = "";


        const xhr = new XMLHttpRequest();

        xhr.open(
            "POST",
            "https://mudfoot.doc.stu.mmu.ac.uk/node/api/creditcard",
            true
        );

        xhr.setRequestHeader(
            "Content-Type",
            "application/json"
        );


        xhr.onreadystatechange = function() {

            if (xhr.readyState !== 4) return;

            spinner.style.display = "none";

            if (xhr.status === 200) {

                try {

                    const response = JSON.parse(xhr.responseText);

                    if (response.message) {

                        sessionStorage.setItem(
                            "last4Digits",
                            cleanNumber.slice(-4)
                        );

                        sessionStorage.setItem(
                            "paymentAmount",
                            getTotal().toFixed(2)
                        );

                        sessionStorage.setItem(
                            "orderItems",
                            JSON.stringify(cart)
                        );

                        window.location.href = "success.html";

                    } else {

                        paymentStatus.innerHTML = `
                            <div class="error">
                                Payment failed
                            </div>
                        `;
                    }

                } catch (err) {

                    paymentStatus.innerHTML = `
                        <div class="error">
                            Error reading server response
                        </div>
                    `;
                }

            } else {

                paymentStatus.innerHTML = `
                    <div class="error">
                        Server error (HTTP ${xhr.status})
                    </div>
                `;
            }
        };


        xhr.onerror = function() {

            spinner.style.display = "none";

            paymentStatus.innerHTML = `
                <div class="error">
                    Could not connect to server
                </div>
            `;
        };

        xhr.send(JSON.stringify(payload));
    });


    // format card number while typing
    const cardInput = document.getElementById("cardNumber");

    cardInput.addEventListener("input", function(e) {

        let value = e.target.value.replace(/\D/g, "");

        // max 16 digits
        value = value.substring(0, 16);

        let formatted = "";

        for (let i = 0; i < value.length; i++) {

            if (i > 0 && i % 4 === 0) {
                formatted += " ";
            }

            formatted += value[i];
        }

        e.target.value = formatted;
    });

    initHamburgerMenu();
}


// success page
if (document.querySelector(".success-container")) {

    const last4 =
        sessionStorage.getItem("last4Digits") || "1234";

    const amount =
        sessionStorage.getItem("paymentAmount") || "0.00";

    const savedItems =
        sessionStorage.getItem("orderItems");

    const cardDisplay =
        document.getElementById("cardDisplay");

    if (cardDisplay) {

        cardDisplay.textContent =
            "Card ending: ************" + last4;
    }

    const orderSummary =
        document.getElementById("orderSummarySuccess");

    if (orderSummary && savedItems) {

        const items = JSON.parse(savedItems);

        let names = "";

        items.forEach(function(item, index) {

            if (index > 0) {
                names += ", ";
            }

            names += item.title;
        });

        orderSummary.innerHTML = `
            <strong>Purchased:</strong> ${names}
            <br>
            <strong>Total: $${amount}</strong>
        `;
    }

    // clear old session data
    sessionStorage.removeItem("bookCart");
    sessionStorage.removeItem("last4Digits");
    sessionStorage.removeItem("paymentAmount");
    sessionStorage.removeItem("orderItems");

    initHamburgerMenu();
}


// active nav links while scrolling
function setActiveNavLink() {

    const sections = document.querySelectorAll(".section");
    const navLinks = document.querySelectorAll(".nav-menu a");

    if (!sections.length) return;

    const scrollPos = window.scrollY + 100;

    sections.forEach(function(section) {

        const top = section.offsetTop;
        const bottom = top + section.offsetHeight;

        if (scrollPos >= top && scrollPos < bottom) {

            const currentId = section.id;

            navLinks.forEach(function(link) {

                link.classList.remove("active");

                if (link.getAttribute("href") === "#" + currentId) {
                    link.classList.add("active");
                }
            });
        }
    });
}


window.addEventListener("scroll", setActiveNavLink);
window.addEventListener("load", setActiveNavLink);


// contact form
if (document.getElementById("contactForm")) {

    const contactForm = document.getElementById("contactForm");
    const formStatus = document.getElementById("formStatus");

    contactForm.addEventListener("submit", function(e) {

        e.preventDefault();

        document.querySelectorAll(
            "#contactForm .error-message"
        ).forEach(function(error) {

            error.textContent = "";
        });

        const name = document.getElementById("name");
        const email = document.getElementById("email");
        const subject = document.getElementById("subject");
        const message = document.getElementById("message");

        let valid = true;

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!name.value.trim()) {

            document.getElementById("nameError").textContent =
                "Please enter your name";

            valid = false;
        }

        if (
            !email.value.trim() ||
            !emailPattern.test(email.value)
        ) {

            document.getElementById("emailError").textContent =
                "Enter a valid email";

            valid = false;
        }

        if (!subject.value) {

            document.getElementById("subjectError").textContent =
                "Select a subject";

            valid = false;
        }

        if (
            !message.value.trim() ||
            message.value.trim().length < 10
        ) {

            document.getElementById("messageError").textContent =
                "Message is too short";

            valid = false;
        }


        if (valid) {

            formStatus.className = "form-status success";

            formStatus.innerHTML =
                "✓ Thanks for your message!";

            contactForm.reset();

            setTimeout(function() {

                formStatus.innerHTML = "";
                formStatus.className = "";

            }, 5000);

        } else {

            formStatus.className = "form-status error";

            formStatus.innerHTML =
                "✗ Please fix the errors above.";

            setTimeout(function() {

                formStatus.innerHTML = "";
                formStatus.className = "";

            }, 4000);
        }
    });
}
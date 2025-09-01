const loginForm = document.getElementById("loginForm");
const orderForm = document.getElementById("orderForm");
const orderSection = document.getElementById("orderSection");

let token = null;

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (data.success) {
        token = data.token;
        alert("Sikeres belépés!");
        loginForm.style.display = "none";
        orderSection.style.display = "block";
    } else {
        alert("Hibás belépési adatok!");
    }
});

orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const customerName = document.getElementById("customerName").value;
    const description = document.getElementById("description").value;
    const date = document.getElementById("date").value;

    const res = await fetch("/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName, description, date }),
    });

    const data = await res.json();
    if (res.ok) {
        alert("Megrendelés rögzítve!");
        orderForm.reset();
    } else {
        alert("Hiba: " + data.error);
    }
});

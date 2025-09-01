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
    console.log("Form submitted");

    const customerName = document.getElementById("customerName");
    const description = document.getElementById("description");
    const date = document.getElementById("date");

    console.log("Customer Name:", customerName ? customerName.value : "Not found");
    console.log("Description:", description ? description.value : "Not found");
    console.log("Date:", date ? date.value : "Not found");

    // Proceed with the fetch request if all fields are valid
    if (customerName && description && date) {
        const res = await fetch("/order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`, // Include the token here
            },
            body: JSON.stringify({
                customerName: customerName.value,
                description: description.value,
                actualDate: date.value,
            }),
        });

        const data = await res.json();
        if (res.ok) {
            alert("Megrendelés rögzítve!");
            orderForm.reset();
        } else {
            alert("Hiba: " + data.error);
        }
    } else {
        alert("Hiba: Hiányzó mezők!");
    }
});
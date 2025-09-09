const loginForm = document.getElementById("loginForm");
const orderForm = document.getElementById("orderForm");
const orderSection = document.getElementById("orderSection");
const databaseSection = document.getElementById("databaseSection");

let token = null;
let userEmail = null; // Store logged-in user's email

document.querySelectorAll("#menu a").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const sectionId = e.target.dataset.section;
    document.querySelectorAll("main section").forEach(sec => sec.style.display = "none");
    document.getElementById(sectionId).style.display = "block";

    if (sectionId === "databaseSection") {
      // Only load orders if admin
      if (userEmail === "admin") {
        loadOrders();
      } else {
        databaseSection.innerHTML = "<p>Nincs jogosultság a rendelések megtekintéséhez.</p>";
      }
    }
  });
});

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.success) {
        token = data.token;
        userEmail = email; // Save the logged-in user's email
        alert("Sikeres belépés!");
        loginForm.style.display = "none";
        orderSection.style.display = "block";
        // Menü frissítése
        document.querySelector('[data-section="orderSection"]').style.display = "inline";
        // Only show orders menu for admin
        if (userEmail === "admin") {
          document.querySelector('[data-section="databaseSection"]').style.display = "inline";
        } else {
          document.querySelector('[data-section="databaseSection"]').style.display = "none";
        }
    } else {
        alert("Hibás belépési adatok!");
    }
});

orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(orderForm);
    const order = Object.fromEntries(formData.entries());

    const res = await fetch("/order", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(order),
    });

    if (res.ok) {
        alert("Megrendelés rögzítve!");
        orderForm.reset();
        if (userEmail === "admin") loadOrders();
    } else {
        const text = await res.text();
        alert("Hiba: " + text);
    }
});

async function loadOrders() {
  if (userEmail !== "admin") {
    ordersSection.innerHTML = "<p>Nincs jogosultság a rendelések megtekintéséhez.</p>";
    return;
  }
  const res = await fetch("/orders", {
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (!res.ok) {
    ordersSection.innerHTML = "<p>Nem sikerült betölteni a rendeléseket.</p>";
    return;
  }

  const orders = await res.json();
  renderOrders(orders);
}

function renderOrders(orders) {
  const container = document.querySelector("#databaseSection");
  container.innerHTML = "<h2>Rendelések</h2>";

  if (orders.length === 0) {
    container.innerHTML += "<p>Nincsenek rendelések.</p>";
    return;
  }

  let table = `
    <table border="1" cellpadding="6" cellspacing="0">
      <thead>
        <tr>
          <th>ID</th>
          <th>Vásárló</th>
          <th>Telefon</th>
          <th>Cím</th>
          <th>Megnevezés</th>
          <th>Státusz</th>
        </tr>
      </thead>
      <tbody>
  `;

  orders.forEach(o => {
    table += `
      <tr>
        <td>${o.id || ""}</td>
        <td>${o.customerName || ""}</td>
        <td>${o.phone || ""}</td>
        <td>${o.address || ""}</td>
        <td>${o.description || ""}</td>
        <td>${o.status || ""}</td>
      </tr>
    `;
  });

  table += "</tbody></table>";
  container.innerHTML += table;
}
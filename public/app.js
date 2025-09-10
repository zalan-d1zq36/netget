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
      if (userEmail === process.env.USERNAME) {
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
        if (userEmail === process.env.USERNAME) {
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

    order.actualDate = new Date().toISOString().slice(0, 10);

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
        if (userEmail === process.env.USERNAME) loadOrders();
    } else {
        const text = await res.text();
        alert("Hiba: " + text);
    }
});

async function loadOrders() {
  if (userEmail !== process.env.USERNAME) {
    databaseSection.innerHTML = "<p>Nincs jogosultság a rendelések megtekintéséhez.</p>";
    return;
  }
  const res = await fetch("/order", {
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (!res.ok) {
    databaseSection.innerHTML = "<p>Nem sikerült betölteni a rendeléseket.</p>";
    return;
  }

  const orders = await res.json();
  renderOrders(orders);
}

function renderOrders(orders) {
  const container = document.querySelector("#databaseSection");
  container.innerHTML = "<h2>Rendelések</h2>";

  if (!orders || orders.length === 0) {
    container.innerHTML += "<p>Nincsenek rendelések.</p>";
    return;
  }

  // Get all column names from the first order
  const columns = Object.keys(orders[0]);

  let table = `
    <div class="card">
    <table border="1" cellpadding="6" cellspacing="0" style="width:100%;">
      <thead>
        <tr>
          ${columns.map(col => `<th>${col}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
  `;

  orders.forEach(order => {
    table += `
      <tr>
        ${columns.map(col => `<td>${order[col] ?? ""}</td>`).join("")}
      </tr>
    `;
  });

  table += "</tbody></table></div>";
  container.innerHTML += table;
}
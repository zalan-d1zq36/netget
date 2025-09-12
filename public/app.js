const loginForm = document.getElementById("loginForm");
const orderForm = document.getElementById("orderForm");
const orderSection = document.getElementById("orderSection");
const databaseSection = document.getElementById("databaseSection");
const logoutBtn = document.getElementById("logoutBtn");

let token = null;
let currentUser = null;
let tokenCheckInterval = null;

// Notification System
class NotificationManager {
    constructor() {
        this.container = document.getElementById('toast-container');
    }

    show(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        
        const iconEl = document.createElement('span');
        iconEl.className = 'toast-icon';
        iconEl.textContent = icons[type] || '';
        
        const msgEl = document.createElement('span');
        msgEl.className = 'toast-message';
        msgEl.textContent = String(message);
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.setAttribute('type', 'button');
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => toast.remove());
        
        toast.appendChild(iconEl);
        toast.appendChild(msgEl);
        toast.appendChild(closeBtn);
        
        this.container.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
        
        return toast;
    }

    success(message, duration = 4000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 6000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 5000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 4000) {
        return this.show(message, 'info', duration);
    }
}

// Form Validation Utilities
class ValidationUtils {
    static isEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    static isPhoneNumber(phone) {
        // Hungarian phone number format
        const phoneRegex = /^(\+36|06)?[1-9][0-9]{7,8}$/;
        return phoneRegex.test(phone.replace(/[\s-]/g, ''));
    }
    
    static isNotEmpty(value) {
        return value && value.toString().trim().length > 0;
    }
    
    static minLength(value, min) {
        return value && value.toString().trim().length >= min;
    }
    
    static maxLength(value, max) {
        return !value || value.toString().trim().length <= max;
    }
    
    static isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }
    
    static isNotFutureDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        return date <= today;
    }
    
    static isAlphanumeric(value) {
        const alphanumericRegex = /^[a-zA-Z0-9\s-_]+$/;
        return alphanumericRegex.test(value);
    }
}

// Form Field Validator
class FieldValidator {
    constructor(field, rules = []) {
        this.field = field;
        this.rules = rules;
        this.setupValidation();
    }
    
    setupValidation() {
        // Create form group wrapper if it doesn't exist
        if (!this.field.parentElement.classList.contains('form-group')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'form-group';
            this.field.parentElement.insertBefore(wrapper, this.field);
            wrapper.appendChild(this.field.previousElementSibling); // Move label
            wrapper.appendChild(this.field);
        }
        
        this.formGroup = this.field.closest('.form-group');
        
        // Add error message container
        let errorMsg = this.formGroup.querySelector('.error-message');
        if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            this.formGroup.appendChild(errorMsg);
        }
        this.errorMessage = errorMsg;
        
        // Add success message container
        let successMsg = this.formGroup.querySelector('.success-message');
        if (!successMsg) {
            successMsg = document.createElement('div');
            successMsg.className = 'success-message';
            this.formGroup.appendChild(successMsg);
        }
        this.successMessage = successMsg;
        
        // Add event listeners
        this.field.addEventListener('blur', () => this.validate());
        this.field.addEventListener('input', () => this.clearValidation());
    }
    
    validate() {
        const value = this.field.value;
        
        for (const rule of this.rules) {
            const result = rule.validator(value);
            if (!result) {
                this.showError(rule.message);
                return false;
            }
        }
        
        this.showSuccess();
        return true;
    }
    
    showError(message) {
        this.formGroup.classList.remove('success');
        this.formGroup.classList.add('error');
        this.errorMessage.textContent = message;
    }
    
    showSuccess(message = 'Helyes') {
        this.formGroup.classList.remove('error');
        this.formGroup.classList.add('success');
        this.successMessage.textContent = message;
    }
    
    clearValidation() {
        this.formGroup.classList.remove('error', 'success');
    }
}

// Initialize notification manager
const notify = new NotificationManager();

// Helper functions for role checking
function hasRole(role) {
    return currentUser && currentUser.role === role;
}

function isAdmin() {
    return hasRole('[ADMIN]');
}

function isNetgetEmployee() {
    return hasRole('[NETGET_EMPLOYEE]');
}

function canManageOrders() {
    return isAdmin() || isNetgetEmployee();
}

function canViewDatabase() {
    return canManageOrders();
}

function canGeneratePDF() {
    return isAdmin() || isNetgetEmployee();
}

// Token expiration and session management
function isTokenExpired(token) {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch (e) {
        return true;
    }
}

function startTokenCheck() {
    if (tokenCheckInterval) clearInterval(tokenCheckInterval);
    tokenCheckInterval = setInterval(() => {
        if (token && isTokenExpired(token)) {
            notify.warning('A munkamenet lejárt. Kérjük, jelentkezzen be újra!');
            resetToLoginState();
            if (tokenCheckInterval) {
                clearInterval(tokenCheckInterval);
                tokenCheckInterval = null;
            }
        }
    }, 30000); // Check every 30 seconds
}

function stopTokenCheck() {
    if (tokenCheckInterval) {
        clearInterval(tokenCheckInterval);
        tokenCheckInterval = null;
    }
}

document.querySelectorAll("#menu a").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll("#menu a").forEach(l => l.classList.remove("active"));
    link.classList.add("active");
    document.querySelectorAll("main section").forEach(sec => sec.style.display = "none");
    document.getElementById(link.dataset.section).style.display = "block";
    if (link.dataset.section === "databaseSection") {
      if (canViewDatabase()) {
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
        currentUser = data.user; // Store full user object with role
        notify.success(`Sikeres belépés! Üdvözöljük, ${currentUser.name}!`);
        loginForm.style.display = "none";
        orderSection.style.display = "block";
        logoutBtn.style.display = "inline-block";

        // Always show menu links after login
        document.querySelector('[data-section="loginSection"]').style.display = "inline";
        document.querySelector('[data-section="orderSection"]').style.display = "inline";
        
        // Show database section for admins and employees
        if (canViewDatabase()) {
          document.querySelector('[data-section="databaseSection"]').style.display = "inline";
        } else {
          document.querySelector('[data-section="databaseSection"]').style.display = "none";
        }
        
        // Setup role-based form field visibility
        setupRoleBasedFormFields();
        
        document.querySelectorAll("#menu a").forEach(l => l.classList.remove("active"));
        document.querySelector('[data-section="orderSection"]').classList.add("active");
        document.getElementById("loginSection").style.display = "none";
        document.getElementById("databaseSection").style.display = "none";
        document.getElementById("orderSection").style.display = "block";
        
        // Start token expiration checking
        startTokenCheck();
    } else {
        notify.error(data.error || "Hibás belépési adatok!");
    }
});

// Helper function to reset application to initial state
function resetToLoginState() {
  // Stop token checking
  stopTokenCheck();
  
  // Clear authentication data
  token = null;
  currentUser = null;
  
  // Reset all forms properly
  loginForm.reset();
  orderForm.reset();
  
  // Clear login form fields explicitly
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  
  // Show login form and hide others
  loginForm.style.display = "block";
  
  // Show login section, hide all others
  document.getElementById("loginSection").style.display = "block";
  document.getElementById("orderSection").style.display = "none";
  document.getElementById("databaseSection").style.display = "none";
  
  // Reset menu visibility - only show login menu item
  document.querySelector('[data-section="loginSection"]').style.display = "inline";
  document.querySelector('[data-section="orderSection"]').style.display = "none";
  document.querySelector('[data-section="databaseSection"]').style.display = "none";
  
  // Reset menu active state
  document.querySelectorAll("#menu a").forEach(l => l.classList.remove("active"));
  document.querySelector('[data-section="loginSection"]').classList.add("active");
  
  // Hide logout button
  logoutBtn.style.display = "none";
  
  // Clear any content in database section
  databaseSection.innerHTML = "<h2>Rendelések</h2><div class='card'><p>Bejelentkezés szükséges.</p></div>";
  
  // Reset role-based form fields
  resetFormFieldVisibility();
}

// LOGOUT
logoutBtn.addEventListener("click", () => {
  resetToLoginState();
  notify.info("Sikeresen kijelentkeztél!");
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
        notify.success("Megrendelés sikeresen rögzítve!");
        orderForm.reset();
        if (canViewDatabase()) loadOrders(currentPage, itemsPerPage);
    } else {
        const text = await res.text();
        notify.error("Hiba a megrendelés rögzítésekor: " + text);
    }
});

// Pagination state
let currentPage = 1;
let itemsPerPage = 20;
let totalPages = 1;

async function loadOrders(page = 1, limit = 20) {
  if (!canViewDatabase()) {
    databaseSection.innerHTML = "<p>Nincs jogosultság a rendelések megtekintéséhez.</p>";
    return;
  }
  
  const res = await fetch(`/order?page=${page}&limit=${limit}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  
  if (!res.ok) {
    databaseSection.innerHTML = "<p>Nem sikerült betölteni a rendeléseket.</p>";
    return;
  }
  
  const data = await res.json();
  currentPage = data.pagination.page;
  itemsPerPage = data.pagination.limit;
  totalPages = data.pagination.totalPages;
  
  renderOrders(data.orders, data.pagination);
}

function renderOrders(orders, pagination) {
  const container = document.querySelector("#databaseSection");
  // Clear container and set title safely
  container.innerHTML = "";
  const title = document.createElement('h2');
  title.textContent = 'Rendelések';
  container.appendChild(title);

  if (!orders || orders.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'Nincsenek rendelések.';
    container.appendChild(p);
    return;
  }

  const card = document.createElement('div');
  card.className = 'card';
  const table = document.createElement('table');
  table.setAttribute('border', '1');
  table.setAttribute('cellpadding', '6');
  table.setAttribute('cellspacing', '0');
  table.className = 'orders-table';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const columns = Object.keys(orders[0]);
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  orders.forEach(order => {
    const tr = document.createElement('tr');
    columns.forEach(col => {
      const td = document.createElement('td');
      const value = order[col] ?? '';
      td.textContent = String(value);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  // Add action buttons for admins/employees
  if (canManageOrders()) {
    const actionsHeader = document.createElement('th');
    actionsHeader.textContent = 'Műveletek';
    headerRow.appendChild(actionsHeader);
    
    orders.forEach((order, index) => {
      const tr = tbody.children[index];
      const actionsTd = document.createElement('td');
      
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Szerkesztés';
      editBtn.className = 'btn-edit';
      editBtn.onclick = () => openEditModal(order);
      
      // Only admins can delete
      if (isAdmin()) {
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Törlés';
        deleteBtn.className = 'btn-delete';
        deleteBtn.onclick = () => deleteOrderPrompt(order.id);
        actionsTd.appendChild(deleteBtn);
      }
      actionsTd.appendChild(editBtn);
      
      // Add PDF generation buttons
      if (canGeneratePDF()) {
        const pdfContainer = document.createElement('div');
        pdfContainer.className = 'pdf-buttons-container';
        pdfContainer.style.marginTop = '8px';
        
        // PDF dropdown button
        const pdfDropdown = document.createElement('div');
        pdfDropdown.className = 'pdf-dropdown';
        
        const pdfMainBtn = document.createElement('button');
        pdfMainBtn.textContent = 'PDF ▼';
        pdfMainBtn.className = 'btn-pdf-main';
        pdfMainBtn.onclick = (e) => {
          e.stopPropagation();
          togglePdfDropdown(e.target.nextElementSibling);
        };
        
        const pdfMenu = document.createElement('div');
        pdfMenu.className = 'pdf-dropdown-menu';
        
        // Offer PDF
        const offerBtn = document.createElement('button');
        offerBtn.textContent = '📄 Árajánlat';
        offerBtn.className = 'pdf-menu-item';
        offerBtn.onclick = () => generatePDF(order.id, 'offer');
        
        // Worksheet PDF
        const worksheetBtn = document.createElement('button');
        worksheetBtn.textContent = '📋 Munkalap';
        worksheetBtn.className = 'pdf-menu-item';
        worksheetBtn.onclick = () => generatePDF(order.id, 'worksheet');
        
        // Kiadni PDF 
        const kiadniBtn = document.createElement('button');
        kiadniBtn.textContent = '📋 Kiadni';
        kiadniBtn.className = 'pdf-menu-item';
        kiadniBtn.onclick = () => generatePDF(order.id, 'kiadni');
        
        // Invoice PDF
        const invoiceBtn = document.createElement('button');
        invoiceBtn.textContent = '🧾 Számla';
        invoiceBtn.className = 'pdf-menu-item';
        invoiceBtn.onclick = () => generatePDF(order.id, 'invoice');
        
        pdfMenu.appendChild(offerBtn);
        pdfMenu.appendChild(worksheetBtn);
        pdfMenu.appendChild(kiadniBtn);
        pdfMenu.appendChild(invoiceBtn);
        
        pdfDropdown.appendChild(pdfMainBtn);
        pdfDropdown.appendChild(pdfMenu);
        pdfContainer.appendChild(pdfDropdown);
        actionsTd.appendChild(pdfContainer);
      }
      
      // Add email send button
      if (canManageOrders()) {
        const emailBtn = document.createElement('button');
        emailBtn.textContent = '📧 Email küldés';
        emailBtn.className = 'btn-email';
        emailBtn.style.marginTop = '8px';
        emailBtn.onclick = () => sendOrderEmail(order.id);
        actionsTd.appendChild(emailBtn);
      }
      
      tr.appendChild(actionsTd);
    });
  }
  
  card.appendChild(table);
  container.appendChild(card);
  
  // Add pagination controls
  if (pagination) {
    const paginationDiv = createPaginationControls(pagination);
    container.appendChild(paginationDiv);
  }
  
  // Add edit modal if it doesn't exist
  if (canManageOrders() && !document.getElementById('editModal')) {
    createEditModal();
  }
}

// Create edit modal for admin/employee use
function createEditModal() {
  const modal = document.createElement('div');
  modal.id = 'editModal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h3>Rendelés szerkesztése</h3>
      <form id="editForm">
        <input type="hidden" id="editOrderId">
        <label for="editStatus">Státusz:</label>
        <select id="editStatus" name="status">
          <option value="Beérkezett">Beérkezett</option>
          <option value="Folyamatban">Folyamatban</option>
          <option value="Javitás alatt">Javitás alatt</option>
          <option value="Kész">Kész</option>
          <option value="Levél készült">Levél készült</option>
          <option value="Elutasitva">Elutasitva</option>
        </select>
        
        <label for="editTechnician">Szerelő:</label>
        <input type="text" id="editTechnician" name="technician">
        
        <label for="editInvoice">Számla:</label>
        <input type="text" id="editInvoice" name="invoice">
        
        <label for="editNote">Megjegyzés:</label>
        <textarea id="editNote" name="note"></textarea>
        
        <div class="modal-buttons">
          <button type="button" id="cancelEditBtn">Mégse</button>
          <button type="submit">Mentés</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Add event listeners
  document.getElementById('editForm').addEventListener('submit', updateOrderHandler);
  
  // Add close button event listeners
  modal.querySelector('.close').addEventListener('click', closeEditModal);
  document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeEditModal();
    }
  });
}

function openEditModal(order) {
  const modal = document.getElementById('editModal');
  document.getElementById('editOrderId').value = order.id;
  document.getElementById('editStatus').value = order.status || '';
  document.getElementById('editTechnician').value = order.technician || '';
  document.getElementById('editInvoice').value = order.invoice || '';
  document.getElementById('editNote').value = order.note || '';
  modal.style.display = 'block';
}

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
}

async function updateOrderHandler(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const updates = Object.fromEntries(formData.entries());
  const orderId = document.getElementById('editOrderId').value;
  
  try {
    const res = await fetch(`/order/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    
    if (res.ok) {
      notify.success('Rendelés sikeresen frissítve!');
      closeEditModal();
      loadOrders(currentPage, itemsPerPage); // Reload the orders
    } else {
      const error = await res.text();
      notify.error('Hiba a frissítés során: ' + error);
    }
  } catch (err) {
    notify.error('Hálózati hiba: ' + err.message);
  }
}

async function deleteOrderPrompt(orderId) {
  if (!isAdmin()) {
    notify.error('Csak adminisztrátorok törölhetnek rendeléseket.');
    return;
  }
  
  if (confirm('Biztosan törölni szeretné ezt a rendelést? Ez a művelet nem vonható vissza!')) {
    try {
      const res = await fetch(`/order/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        notify.success('Rendelés sikeresen törölve!');
        loadOrders(currentPage, itemsPerPage); // Reload the orders
      } else {
        const error = await res.text();
        notify.error('Hiba a törlés során: ' + error);
      }
    } catch (err) {
      notify.error('Hálózati hiba: ' + err.message);
    }
  }
}

// Role-based form field management (these fields are no longer in the form)
function setupRoleBasedFormFields() {
  // No longer needed since status, technician, invoice fields are removed from form
}

function resetFormFieldVisibility() {
  // No longer needed since status, technician, invoice fields are removed from form
}

// Create pagination controls
function createPaginationControls(pagination) {
  const paginationDiv = document.createElement('div');
  paginationDiv.className = 'pagination-controls';
  
  // Items per page selector
  const itemsPerPageDiv = document.createElement('div');
  itemsPerPageDiv.className = 'items-per-page';
  
  const itemsLabel = document.createElement('span');
  itemsLabel.textContent = 'Elemek száma oldalanként: ';
  itemsPerPageDiv.appendChild(itemsLabel);
  
  const itemsSelect = document.createElement('select');
  itemsSelect.className = 'items-select';
  [20, 50, 100].forEach(size => {
    const option = document.createElement('option');
    option.value = size;
    option.textContent = size;
    option.selected = size === pagination.limit;
    itemsSelect.appendChild(option);
  });
  
  itemsSelect.addEventListener('change', () => {
    loadOrders(1, parseInt(itemsSelect.value));
  });
  
  itemsPerPageDiv.appendChild(itemsSelect);
  
  // Page info
  const pageInfo = document.createElement('div');
  pageInfo.className = 'page-info';
  pageInfo.textContent = `Oldal ${pagination.page} / ${pagination.totalPages} (Összesen: ${pagination.total} elem)`;
  
  // Navigation buttons
  const navButtons = document.createElement('div');
  navButtons.className = 'nav-buttons';
  
  // First page
  const firstBtn = document.createElement('button');
  firstBtn.textContent = '<<';
  firstBtn.disabled = pagination.page === 1;
  firstBtn.onclick = () => loadOrders(1, pagination.limit);
  navButtons.appendChild(firstBtn);
  
  // Previous page
  const prevBtn = document.createElement('button');
  prevBtn.textContent = '<';
  prevBtn.disabled = !pagination.hasPrev;
  prevBtn.onclick = () => loadOrders(pagination.page - 1, pagination.limit);
  navButtons.appendChild(prevBtn);
  
  // Page numbers
  const startPage = Math.max(1, pagination.page - 2);
  const endPage = Math.min(pagination.totalPages, pagination.page + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = i;
    pageBtn.className = i === pagination.page ? 'active' : '';
    pageBtn.onclick = () => loadOrders(i, pagination.limit);
    navButtons.appendChild(pageBtn);
  }
  
  // Next page
  const nextBtn = document.createElement('button');
  nextBtn.textContent = '>';
  nextBtn.disabled = !pagination.hasNext;
  nextBtn.onclick = () => loadOrders(pagination.page + 1, pagination.limit);
  navButtons.appendChild(nextBtn);
  
  // Last page
  const lastBtn = document.createElement('button');
  lastBtn.textContent = '>>';
  lastBtn.disabled = pagination.page === pagination.totalPages;
  lastBtn.onclick = () => loadOrders(pagination.totalPages, pagination.limit);
  navButtons.appendChild(lastBtn);
  
  paginationDiv.appendChild(itemsPerPageDiv);
  paginationDiv.appendChild(pageInfo);
  paginationDiv.appendChild(navButtons);
  
  return paginationDiv;
}

// PDF generation functions
async function generatePDF(orderId, pdfType) {
  try {
    notify.info(`${getPdfTypeName(pdfType)} generálása...`);
    const response = await fetch(`/api/pdf/${pdfType}/${orderId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'PDF generálási hiba');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pdfType}-${orderId}-${new Date().toISOString().slice(0, 10)}.pdf`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
    notify.success(`${getPdfTypeName(pdfType)} sikeresen generálva!`);
  } catch (error) {
    notify.error(`Hiba a PDF generálása során: ${error.message}`);
  }
}

function getPdfTypeName(pdfType) {
  const names = {
    'invoice': 'Számla',
    'offer': 'Ajánlat',
    'kiadni': 'Kiadni',
    'worksheet': 'Munkalap'
  };
  return names[pdfType] || 'PDF';
}

// Toggle PDF dropdown menu
function togglePdfDropdown(menu) {
  // Close all other dropdowns first
  document.querySelectorAll('.pdf-dropdown-menu.show').forEach(dropdown => {
    if (dropdown !== menu) {
      dropdown.classList.remove('show');
    }
  });
  
  // Toggle current menu
  menu.classList.toggle('show');
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.pdf-dropdown')) {
    document.querySelectorAll('.pdf-dropdown-menu.show').forEach(dropdown => {
      dropdown.classList.remove('show');
    });
  }
});

// Initialize form validations
function initializeFormValidation() {
  // Order form validation
  if (document.getElementById('clientName')) {
    new FieldValidator(document.getElementById('clientName'), [
      { validator: ValidationUtils.isNotEmpty, message: 'Megrendelő neve kötelező' },
      { validator: (v) => ValidationUtils.minLength(v, 2), message: 'Minimum 2 karakter szükséges' },
      { validator: (v) => ValidationUtils.maxLength(v, 100), message: 'Maximum 100 karakter engedélyezett' }
    ]);
    
    new FieldValidator(document.getElementById('customerName'), [
      { validator: ValidationUtils.isNotEmpty, message: 'Vásárló neve kötelező' },
      { validator: (v) => ValidationUtils.minLength(v, 2), message: 'Minimum 2 karakter szükséges' },
      { validator: (v) => ValidationUtils.maxLength(v, 100), message: 'Maximum 100 karakter engedélyezett' }
    ]);
    
    new FieldValidator(document.getElementById('phone'), [
      { validator: ValidationUtils.isNotEmpty, message: 'Telefonszám kötelező' },
      { validator: ValidationUtils.isPhoneNumber, message: 'Érvényes telefonszám formátum szükséges' }
    ]);
    
    new FieldValidator(document.getElementById('orderDate'), [
      { validator: ValidationUtils.isNotEmpty, message: 'Megbízás dátuma kötelező' },
      { validator: ValidationUtils.isValidDate, message: 'Érvényes dátum szükséges' },
      { validator: ValidationUtils.isNotFutureDate, message: 'A dátum nem lehet jövőbeli' }
    ]);
    
    new FieldValidator(document.getElementById('purchaseDate'), [
      { validator: ValidationUtils.isNotEmpty, message: 'Vásárlás dátuma kötelező' },
      { validator: ValidationUtils.isValidDate, message: 'Érvényes dátum szükséges' },
      { validator: ValidationUtils.isNotFutureDate, message: 'A dátum nem lehet jövőbeli' }
    ]);
  }
}

// TODO: Email küldés fejlesztendő funkciók:
// TODO: 1. Modal ablak létrehozása címzett adatainak megadásához
// TODO: 2. Email cím validáció a frontend-en
// TODO: 3. Email template előnézet a modal-ban
// TODO: 4. Megerősítés küldés előtt
// TODO: 5. Loading state a küldés alatt

// Email sending function - JELENLEG EGYSZERŰSÍTETT VÁLTOZAT
async function sendOrderEmail(orderId) {
  // TODO: Itt kell megnyitni egy modal ablakot a következő mezőkkel:
  // - Címzett neve (text input)
  // - Címzett email címe (email input, validációval)
  // - Email template előnézet (readonly textarea)
  // - Küldés és Mégse gombok
  
  try {
    notify.info('Email küldése...');
    
    // TODO: Itt kell elküldeni a címzett adatait is:
    // const emailData = {
    //   recipientName: 'Címzett neve a modal-ból',
    //   recipientEmail: 'email@example.com'
    // };
    
    const response = await fetch(`/api/email/send-order/${orderId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
      // TODO: body: JSON.stringify(emailData)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      notify.success('Email sikeresen elküldve!');
    } else {
      throw new Error(result.message || 'Email küldési hiba');
    }
  } catch (error) {
    notify.error(`Hiba az email küldése során: ${error.message}`);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Ensure proper initial state
  resetToLoginState();
  
  // Initialize form validation after a short delay to ensure DOM is ready
  setTimeout(initializeFormValidation, 100);
});


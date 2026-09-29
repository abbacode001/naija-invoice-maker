// ========================================
// CHECK USER LOGIN
// ========================================

async function requireLogin() {

  const {
    data: {
      session
    }
  } = await supabaseClient.auth.getSession();


  if (!session) {

    window.location.href =
      "login.html";

    return null;

  }


  return session;

}


let currentSession = null;


requireLogin().then(session => {

  currentSession = session;

});

// ========================================
// EDIT INVOICE MODE
// ========================================

const editUrlParams =
  new URLSearchParams(
    window.location.search
  );

const editingInvoiceId =
  editUrlParams.get("edit");

let editingInvoice = false;

// ========================================
// DUPLICATE INVOICE MODE
// ========================================

const duplicateUrlParams =
  new URLSearchParams(
    window.location.search
  );

const duplicatingInvoiceId =
  duplicateUrlParams.get("duplicate");

let duplicatingInvoice = false;

// ========================================
// LOAD BUSINESS LOGO
// ========================================

async function loadBusinessLogo() {

  try {

    const {
      data: {
        user
      },
      error: userError
    } = await supabaseClient.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return;
    }

    const {
      data: business,
      error: businessError
    } = await supabaseClient
      .from("businesses")
      .select("logo_url")
      .eq("user_id", user.id)
      .maybeSingle();

    if (businessError) {
      throw businessError;
    }

    const logoElement =
      document.getElementById("previewBusinessLogo");

    if (!logoElement) {
      return;
    }

    if (business?.logo_url) {

      logoElement.src =
        business.logo_url;

      logoElement.style.display =
        "block";

    } else {

      logoElement.src = "";
      logoElement.style.display =
        "none";

    }

  } catch (error) {

    console.error(
      "Unable to load business logo:",
      error
    );

  }

}

let items = [
  {
    description: "",
    quantity: 1,
    price: 0
  }
];
// ========================================
// EXISTING CUSTOMERS
// ========================================

let selectedCustomerId = null;
let customersList = [];

async function loadExistingCustomers() {

  try {

    const {
      data: {
        user
      },
      error: userError
    } = await supabaseClient.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return;
    }

    const {
      data: customers,
      error
    } = await supabaseClient
      .from("customers")
      .select("id, name, phone, email, address")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    customersList = customers || [];

    const select =
      document.getElementById("existingCustomerSelect");

    if (!select) {
      return;
    }

    select.innerHTML =
      '<option value="">-- Select a customer --</option>';

    customersList.forEach(customer => {

      const option =
        document.createElement("option");

      option.value = customer.id;
      option.textContent =
        customer.name +
        (customer.phone
          ? " - " + customer.phone
          : "");

      select.appendChild(option);

    });

  } catch (error) {

    console.error(
      "Unable to load customers:",
      error
    );

  }

}


function selectExistingCustomer(customerId) {

  selectedCustomerId = customerId || null;

  if (!customerId) {
    return;
  }

  const customer =
    customersList.find(
      item => item.id === customerId
    );

  if (!customer) {
    return;
  }

  document.getElementById("customerName").value =
    customer.name || "";

  document.getElementById("customerPhone").value =
    customer.phone || "";

  document.getElementById("customerEmail").value =
    customer.email || "";

  document.getElementById("customerAddress").value =
    customer.address || "";

  updatePreview();

}
// ========================================
// AUTOMATIC INVOICE NUMBER
// ========================================

async function generateNextInvoiceNumber() {

  try {

    const {
      data: {
        user
      },
      error: userError
    } = await supabaseClient.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return;
    }

    // Get business invoice prefix
    const {
      data: business,
      error: businessError
    } = await supabaseClient
      .from("businesses")
      .select("invoice_prefix")
      .eq("user_id", user.id)
      .maybeSingle();

    if (businessError) {
      throw businessError;
    }

    const prefix =
      business?.invoice_prefix || "NIM";

    // Get existing invoice numbers
    const {
      data: invoices,
      error: invoiceError
    } = await supabaseClient
      .from("invoices")
      .select("invoice_number")
      .eq("user_id", user.id);

    if (invoiceError) {
      throw invoiceError;
    }

    let highestNumber = 0;

    (invoices || []).forEach(invoice => {

      const invoiceNumber =
        invoice.invoice_number || "";

      if (!invoiceNumber.startsWith(prefix + "-")) {
        return;
      }

      const numberPart =
        invoiceNumber.substring(
          (prefix + "-").length
        );

      const number =
        parseInt(numberPart, 10);

      if (!isNaN(number) && number > highestNumber) {
        highestNumber = number;
      }

    });

    const nextNumber = highestNumber + 1;

    const formattedNumber =
      String(nextNumber).padStart(4, "0");

    const invoiceNumber =
      `${prefix}-${formattedNumber}`;

    document.getElementById("invoiceNumber").value =
      invoiceNumber;

    updatePreview();

  } catch (error) {

    console.error(
      "Unable to generate invoice number:",
      error
    );

  }

}


// ===============================
// INITIALIZATION
// ===============================

document.addEventListener("DOMContentLoaded", async () => {

  if (editingInvoiceId) {

    await loadInvoiceForEditing();

  } else if (duplicatingInvoiceId) {

    await loadInvoiceForDuplicate ();

  } else {

  const today = new Date();

  document.getElementById("invoiceDate").value =
    formatDateForInput(today);

  const dueDate = new Date();

  dueDate.setDate(today.getDate() + 7);

  document.getElementById("dueDate").value =
    formatDateForInput(dueDate);

  renderItems();

  updatePreview();

  loadBusinessLogo();

  generateNextInvoiceNumber();

  }

  loadExistingCustomers();

  document
    .getElementById("existingCustomerSelect")
    .addEventListener("change", function () {
      selectExistingCustomer(this.value);
    });
    document
  .getElementById("addNewCustomerBtn")
  .addEventListener("click", function () {

    selectedCustomerId = null;

    document.getElementById("existingCustomerSelect").value = "";

    document.getElementById("customerName").value = "";
    document.getElementById("customerPhone").value = "";
    document.getElementById("customerEmail").value = "";
    document.getElementById("customerAddress").value = "";

    updatePreview();

    document.getElementById("customerName").focus();
  });

});

// ========================================
// LOAD INVOICE FOR EDITING
// ========================================

async function loadInvoiceForEditing() {

  if (!editingInvoiceId) {
    return;
  }

  try {

    const {
      data: {
        user
      },
      error: userError
    } =
      await supabaseClient.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      window.location.href =
        "login.html";

      return;
    }


    // --------------------------------------
    // GET INVOICE
    // --------------------------------------

    const {
      data: invoice,
      error: invoiceError
    } =
      await supabaseClient
        .from("invoices")
        .select(`
          id,
          user_id,
          customer_id,
          invoice_number,
          issue_date,
          due_date,
          status,
          subtotal,
          discount_type,
          discount_value,
          vat_percentage,
          vat_amount,
          total,
          notes,
          customers (
            id,
            name,
            phone,
            email,
            address
          )
        `)
        .eq("id", editingInvoiceId)
        .eq("user_id", user.id)
        .single();


    if (invoiceError) {
      throw invoiceError;
    }


    // --------------------------------------
    // GET INVOICE ITEMS
    // --------------------------------------

    const {
      data: invoiceItems,
      error: itemsError
    } =
      await supabaseClient
        .from("invoice_items")
        .select(`
          id,
          description,
          quantity,
          unit_price,
          total
        `)
        .eq(
          "invoice_id",
          invoice.id
        )
        .order(
          "id",
          {
            ascending: true
          }
        );


    if (itemsError) {
      throw itemsError;
    }


    // --------------------------------------
    // GET BUSINESS INFORMATION
    // --------------------------------------

    const {
      data: business,
      error: businessError
    } =
      await supabaseClient
        .from("businesses")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();


    if (businessError) {
      throw businessError;
    }


    // --------------------------------------
    // BUSINESS
    // --------------------------------------

    document.getElementById(
      "businessName"
    ).value =
      business?.business_name || "";

    document.getElementById(
      "businessPhone"
    ).value =
      business?.phone || "";

    document.getElementById(
      "businessEmail"
    ).value =
      business?.email || "";

    document.getElementById(
      "businessAddress"
    ).value =
      business?.address || "";

      // --------------------------------------
// BUSINESS LOGO
// --------------------------------------

const editLogo =
  document.getElementById(
    "previewBusinessLogo"
  );

if (
  editLogo &&
  business?.logo_url
) {

  editLogo.src =
    business.logo_url;

  editLogo.style.display =
    "block";

} else if (editLogo) {

  editLogo.src = "";

  editLogo.style.display =
    "none";

}


    // --------------------------------------
    // PAYMENT DETAILS
    // --------------------------------------

    document.getElementById(
      "bankName"
    ).value =
      business?.bank_name || "";

    document.getElementById(
      "accountName"
    ).value =
      business?.account_name || "";

    document.getElementById(
      "accountNumber"
    ).value =
      business?.account_number || "";


    // --------------------------------------
    // CUSTOMER
    // --------------------------------------

    selectedCustomerId =
      invoice.customer_id || null;

    const customer =
      invoice.customers;


    document.getElementById(
      "customerName"
    ).value =
      customer?.name || "";

    document.getElementById(
      "customerPhone"
    ).value =
      customer?.phone || "";

    document.getElementById(
      "customerEmail"
    ).value =
      customer?.email || "";

    document.getElementById(
      "customerAddress"
    ).value =
      customer?.address || "";


    // --------------------------------------
    // INVOICE DETAILS
    // --------------------------------------

    document.getElementById(
      "invoiceNumber"
    ).value =
      invoice.invoice_number || "";

    document.getElementById(
      "invoiceDate"
    ).value =
      invoice.issue_date || "";

    document.getElementById(
      "dueDate"
    ).value =
      invoice.due_date || "";

    document.getElementById(
      "invoiceStatus"
    ).value =
      invoice.status || "Unpaid";


    // --------------------------------------
    // DISCOUNT / VAT
    // --------------------------------------

    document.getElementById(
      "discountType"
    ).value =
      invoice.discount_type || "none";

    document.getElementById(
      "discountValue"
    ).value =
      invoice.discount_value || 0;

    document.getElementById(
      "vat"
    ).value =
      invoice.vat_percentage || 0;


    // --------------------------------------
    // NOTES
    // --------------------------------------

    document.getElementById(
      "notes"
    ).value =
      invoice.notes || "";


    // --------------------------------------
    // ITEMS
    // --------------------------------------

    items =
      (invoiceItems || []).map(
        function(item) {

          return {

            description:
              item.description || "",

            quantity:
              Number(item.quantity) || 1,

            price:
              Number(item.unit_price) || 0

          };

        }
      );


    if (items.length === 0) {

      items = [
        {
          description: "",
          quantity: 1,
          price: 0
        }
      ];

    }


    // --------------------------------------
    // EDIT MODE
    // --------------------------------------

    editingInvoice = true;


    // Change page title
    const pageTitle =
      document.querySelector(
        ".page-header h1"
      );

    if (pageTitle) {

      pageTitle.textContent =
        "Edit Invoice";

    }


    // Change description
    const pageDescription =
      document.querySelector(
        ".page-header p"
      );

    if (pageDescription) {

      pageDescription.textContent =
        "Update your invoice details and save the changes.";

    }


    // Change save button text
    const saveButton =
      document.querySelector(
        'button[onclick="saveInvoice()"]'
      );

    if (saveButton) {

      saveButton.textContent =
        "Update Invoice";

    }


    // Render everything
    renderItems();

    updatePreview();


    console.log(
      "Invoice loaded for editing:",
      invoice.id
    );


  } catch (error) {

    console.error(
      "Unable to load invoice for editing:",
      error
    );

    alert(
      "Unable to load invoice for editing:\n\n" +
      error.message
    );

  }

}

// ========================================
// LOAD INVOICE FOR DUPLICATE
// ========================================

async function loadInvoiceForDuplicate() {

  if (!duplicatingInvoiceId) {
    return;
  }

  try {

    const {
      data: {
        user
      },
      error: userError
    } =
      await supabaseClient.auth.getUser();

    if (userError) throw userError;

    if (!user) {
      window.location.href = "login.html";
      return;
    }

    const {
      data: invoice,
      error: invoiceError
    } =
      await supabaseClient
        .from("invoices")
        .select(`
          id,
          user_id,
          customer_id,
          invoice_number,
          issue_date,
          due_date,
          status,
          subtotal,
          discount_type,
          discount_value,
          vat_percentage,
          vat_amount,
          total,
          notes,
          customers (
            id,
            name,
            phone,
            email,
            address
          )
        `)
        .eq("id", duplicatingInvoiceId)
        .eq("user_id", user.id)
        .single();

    if (invoiceError) throw invoiceError;

    const {
      data: invoiceItems,
      error: itemsError
    } =
      await supabaseClient
        .from("invoice_items")
        .select(`
          id,
          description,
          quantity,
          unit_price,
          total
        `)
        .eq("invoice_id", invoice.id)
        .order("id", {
          ascending: true
        });

    if (itemsError) throw itemsError;

    const {
      data: business,
      error: businessError
    } =
      await supabaseClient
        .from("businesses")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (businessError) throw businessError;

    // --------------------------------------
    // BUSINESS INFORMATION
    // --------------------------------------

    document.getElementById("businessName").value =
      business?.business_name || "";

    document.getElementById("businessPhone").value =
      business?.phone || "";

    document.getElementById("businessEmail").value =
      business?.email || "";

    document.getElementById("businessAddress").value =
      business?.address || "";

    document.getElementById("bankName").value =
      business?.bank_name || "";

    document.getElementById("accountName").value =
      business?.account_name || "";

    document.getElementById("accountNumber").value =
      business?.account_number || "";

    // --------------------------------------
    // BUSINESS LOGO
    // --------------------------------------

    const duplicateLogo =
      document.getElementById(
        "previewBusinessLogo"
      );

    if (
      duplicateLogo &&
      business?.logo_url
    ) {

      duplicateLogo.src =
        business.logo_url;

      duplicateLogo.style.display =
        "block";

    } else if (duplicateLogo) {

      duplicateLogo.src = "";

      duplicateLogo.style.display =
        "none";

    }

    // --------------------------------------
    // CUSTOMER
    // --------------------------------------

    selectedCustomerId =
      invoice.customer_id || null;

    const customer =
      invoice.customers;

    document.getElementById("customerName").value =
      customer?.name || "";

    document.getElementById("customerPhone").value =
      customer?.phone || "";

    document.getElementById("customerEmail").value =
      customer?.email || "";

    document.getElementById("customerAddress").value =
      customer?.address || "";

    // --------------------------------------
    // INVOICE DETAILS
    // --------------------------------------

    // IMPORTANT:
    // Do NOT copy the old invoice number.
    // A new number will be generated below.

    document.getElementById("invoiceDate").value =
      formatDateForInput(new Date());

    const newDueDate =
      new Date();

    newDueDate.setDate(
      newDueDate.getDate() + 7
    );

    document.getElementById("dueDate").value =
      formatDateForInput(newDueDate);

    document.getElementById("invoiceStatus").value =
      "Unpaid";

    document.getElementById("discountType").value =
      invoice.discount_type || "none";

    document.getElementById("discountValue").value =
      invoice.discount_value || 0;

    document.getElementById("vat").value =
      invoice.vat_percentage || 0;

    document.getElementById("notes").value =
      invoice.notes || "";

    // --------------------------------------
    // COPY ITEMS
    // --------------------------------------

    items =
      (invoiceItems || []).map(function(item) {

        return {
          description:
            item.description || "",

          quantity:
            Number(item.quantity) || 1,

          price:
            Number(item.unit_price) || 0
        };

      });

    if (items.length === 0) {

      items = [
        {
          description: "",
          quantity: 1,
          price: 0
        }
      ];

    }

    duplicatingInvoice = true;

    // --------------------------------------
    // PAGE TITLE
    // --------------------------------------

    const pageTitle =
      document.querySelector(
        ".page-header h1"
      );

    if (pageTitle) {
      pageTitle.textContent =
        "Duplicate Invoice";
    }

    const pageDescription =
      document.querySelector(
        ".page-header p"
      );

    if (pageDescription) {

      pageDescription.textContent =
        "Create a new invoice using an existing invoice.";

    }

    // --------------------------------------
    // SAVE BUTTON
    // --------------------------------------

    const saveButton =
      document.querySelector(
        'button[onclick="saveInvoice()"]'
      );

    if (saveButton) {

      saveButton.textContent =
        "Save Invoice";

    }

    renderItems();

    updatePreview();

    // --------------------------------------
    // GENERATE NEW INVOICE NUMBER
    // --------------------------------------

    await generateNextInvoiceNumber();

    updatePreview();

    console.log(
      "Invoice loaded for duplication:",
      invoice.id
    );

  } catch (error) {

    console.error(
      "Unable to load invoice for duplication:",
      error
    );

    alert(
      "Unable to load invoice for duplication:\n\n" +
      error.message
    );

  }
}


// ===============================
// DATE
// ===============================

function formatDateForInput(date) {

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function formatDate(dateString) {

  if (!dateString) return "-";

  const date = new Date(dateString);

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

}


// ===============================
// CURRENCY
// ===============================

function formatCurrency(amount) {

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2
  }).format(amount);

}


// ===============================
// ITEMS
// ===============================

function addItem() {

  items.push({
    description: "",
    quantity: 1,
    price: 0
  });

  renderItems();
  updatePreview();

}


function removeItem(index) {

  if (items.length === 1) {

    items[0] = {
      description: "",
      quantity: 1,
      price: 0
    };

  } else {

    items.splice(index, 1);

  }

  renderItems();
  updatePreview();

}


function renderItems() {

  const container =
    document.getElementById("itemsContainer");

  container.innerHTML = "";

  items.forEach((item, index) => {

    const row = document.createElement("div");

    row.className = "item-editor";

    row.innerHTML = `

      <input
        type="text"
        placeholder="Item or service"
        value="${escapeHTML(item.description)}"
        oninput="updateItem(${index}, 'description', this.value)"
      >

      <input
        type="number"
        min="1"
        value="${item.quantity}"
        oninput="updateItem(${index}, 'quantity', this.value)"
      >

      <input
        type="number"
        min="0"
        value="${item.price}"
        placeholder="0"
        oninput="updateItem(${index}, 'price', this.value)"
      >

      <button
        class="remove-item"
        onclick="removeItem(${index})"
        title="Remove item"
      >
        ×
      </button>

    `;

    container.appendChild(row);

  });

}


function updateItem(index, field, value) {

  if (field === "quantity" || field === "price") {

    items[index][field] =
      Number(value) || 0;

  } else {

    items[index][field] = value;

  }

  updatePreview();

}


// ===============================
// CALCULATIONS
// ===============================

function calculateTotals() {

  let subtotal = 0;

  items.forEach(item => {

    const quantity =
      Number(item.quantity) || 0;

    const price =
      Number(item.price) || 0;

    subtotal += quantity * price;

  });


  const discountType =
    document.getElementById("discountType").value;

  const discountValue =
    Number(
      document.getElementById("discountValue").value
    ) || 0;

  let discount = 0;

  if (discountType === "percentage") {

    discount =
      subtotal * (discountValue / 100);

  }

  if (discountType === "fixed") {

    discount = discountValue;

  }

  discount =
    Math.min(discount, subtotal);


  const amountAfterDiscount =
    subtotal - discount;


  const vatPercentage =
    Number(
      document.getElementById("vat").value
    ) || 0;


  const vat =
    amountAfterDiscount *
    (vatPercentage / 100);


  const total =
    amountAfterDiscount + vat;


  return {
    subtotal,
    discount,
    vat,
    total
  };

}


// ===============================
// LIVE PREVIEW
// ===============================

function updatePreview() {

  const businessName =
    document.getElementById("businessName").value ||
    "Your Business Name";

  const businessPhone =
    document.getElementById("businessPhone").value ||
    "Phone";

  const businessEmail =
    document.getElementById("businessEmail").value ||
    "Email";

  const businessAddress =
    document.getElementById("businessAddress").value ||
    "Business Address";


  document.getElementById(
    "previewBusinessName"
  ).textContent = businessName;

  document.getElementById(
    "previewBusinessPhone"
  ).textContent = businessPhone;

  document.getElementById(
    "previewBusinessEmail"
  ).textContent = businessEmail;

  document.getElementById(
    "previewBusinessAddress"
  ).textContent = businessAddress;


  // CUSTOMER

  document.getElementById(
    "previewCustomerName"
  ).textContent =
    document.getElementById("customerName").value ||
    "Customer Name";


  document.getElementById(
    "previewCustomerPhone"
  ).textContent =
    document.getElementById("customerPhone").value ||
    "Phone";


  document.getElementById(
    "previewCustomerEmail"
  ).textContent =
    document.getElementById("customerEmail").value ||
    "Email";


  document.getElementById(
    "previewCustomerAddress"
  ).textContent =
    document.getElementById("customerAddress").value ||
    "Customer Address";


  // INVOICE DETAILS

  document.getElementById(
    "previewInvoiceNumber"
  ).textContent =
    document.getElementById("invoiceNumber").value ||
    "NIM-0001";


  document.getElementById(
    "previewInvoiceDate"
  ).textContent =
    formatDate(
      document.getElementById("invoiceDate").value
    );


  document.getElementById(
    "previewDueDate"
  ).textContent =
    formatDate(
      document.getElementById("dueDate").value
    );


  // STATUS

  const status =
    document.getElementById("invoiceStatus").value;

  const statusElement =
    document.getElementById("previewStatus");

  statusElement.textContent =
    status.toUpperCase();

  statusElement.className =
    "status " + status.toLowerCase();


  // ITEMS

  const previewItems =
    document.getElementById("previewItems");

  previewItems.innerHTML = "";


  items.forEach(item => {

    const quantity =
      Number(item.quantity) || 0;

    const price =
      Number(item.price) || 0;

    const total =
      quantity * price;


    const row =
      document.createElement("tr");


    row.innerHTML = `

      <td>
        ${escapeHTML(
          item.description || "Item / Service"
        )}
      </td>

      <td>
        ${quantity}
      </td>

      <td>
        ${formatCurrency(price)}
      </td>

      <td>
        ${formatCurrency(total)}
      </td>

    `;


    previewItems.appendChild(row);

  });


  // TOTALS

  const totals =
    calculateTotals();


  document.getElementById(
    "previewSubtotal"
  ).textContent =
    formatCurrency(totals.subtotal);


  document.getElementById(
    "previewDiscount"
  ).textContent =
    "- " + formatCurrency(totals.discount);


  document.getElementById(
    "previewVAT"
  ).textContent =
    formatCurrency(totals.vat);


  document.getElementById(
    "previewTotal"
  ).textContent =
    formatCurrency(totals.total);


  // PAYMENT

  document.getElementById(
    "previewBankName"
  ).textContent =
    document.getElementById("bankName").value ||
    "-";


  document.getElementById(
    "previewAccountName"
  ).textContent =
    document.getElementById("accountName").value ||
    "-";


  document.getElementById(
    "previewAccountNumber"
  ).textContent =
    document.getElementById("accountNumber").value ||
    "-";


  // NOTES

  document.getElementById(
    "previewNotes"
  ).textContent =
    document.getElementById("notes").value ||
    "";

}


// ===============================
// PRINT
// ===============================

function printInvoice() {

  updatePreview();

  window.print();

}


// ===============================
// WHATSAPP
// ===============================

function shareWhatsApp() {

  const customerName =
    document.getElementById("customerName").value ||
    "Customer";

  const invoiceNumber =
    document.getElementById("invoiceNumber").value ||
    "NIM-0001";

  const totals =
    calculateTotals();


  const message =
    `Hello ${customerName},

Your invoice ${invoiceNumber} from Naija Invoice Maker is ready.

Total Amount: ${formatCurrency(totals.total)}

Thank you for your business.`;


  const url =
    "https://wa.me/?text=" +
    encodeURIComponent(message);


  window.open(url, "_blank");

}

// ========================================
// INVOICE VALIDATION
// ========================================

function validateInvoiceForm() {

  const customerName =
    document.getElementById("customerName").value.trim();

  const invoiceNumber =
    document.getElementById("invoiceNumber").value.trim();

  const invoiceDate =
    document.getElementById("invoiceDate").value;

  const dueDate =
    document.getElementById("dueDate").value;

  const discountType =
    document.getElementById("discountType").value;

  const discountValue =
    Number(
      document.getElementById("discountValue").value
    );

  const vatPercentage =
    Number(
      document.getElementById("vat").value
    );

  // --------------------------------------
  // CUSTOMER
  // --------------------------------------

  if (!customerName) {
    alert("Please enter the customer name.");
    document.getElementById("customerName").focus();
    return false;
  }

  // --------------------------------------
  // INVOICE NUMBER
  // --------------------------------------

  if (!invoiceNumber) {
    alert("Please enter an invoice number.");
    document.getElementById("invoiceNumber").focus();
    return false;
  }

  // --------------------------------------
  // INVOICE DATE
  // --------------------------------------

  if (!invoiceDate) {
    alert("Please select the invoice date.");
    document.getElementById("invoiceDate").focus();
    return false;
  }

  // --------------------------------------
  // DUE DATE
  // --------------------------------------

  if (
    dueDate &&
    invoiceDate &&
    dueDate < invoiceDate
  ) {
    alert(
      "The due date cannot be earlier than the invoice date."
    );

    document.getElementById("dueDate").focus();

    return false;
  }

  // --------------------------------------
  // ITEMS
  // --------------------------------------

  if (!items || items.length === 0) {
    alert(
      "Please add at least one item or service."
    );

    return false;
  }

  let hasValidItem = false;

  for (let i = 0; i < items.length; i++) {

    const description =
      String(items[i].description || "").trim();

    const quantity =
      Number(items[i].quantity);

    const price =
      Number(items[i].price);

    // Skip completely empty rows
    if (
      !description &&
      (!items[i].quantity || items[i].quantity === 0) &&
      (!items[i].price || items[i].price === 0)
    ) {
      continue;
    }

    if (!description) {
      alert(
        `Please enter a description for item ${i + 1}.`
      );

      return false;
    }

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      alert(
        `Quantity for item ${i + 1} must be greater than 0.`
      );

      return false;
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      alert(
        `Price for item ${i + 1} cannot be negative.`
      );

      return false;
    }

    hasValidItem = true;
  }

  if (!hasValidItem) {
    alert(
      "Please add at least one valid item or service."
    );

    return false;
  }

  // --------------------------------------
  // DISCOUNT
  // --------------------------------------

  if (
    !Number.isFinite(discountValue) ||
    discountValue < 0
  ) {
    alert(
      "Discount value cannot be negative."
    );

    document.getElementById("discountValue").focus();

    return false;
  }

  if (
    discountType === "percentage" &&
    discountValue > 100
  ) {
    alert(
      "Discount percentage cannot be more than 100%."
    );

    document.getElementById("discountValue").focus();

    return false;
  }

  // --------------------------------------
  // VAT
  // --------------------------------------

  if (
    !Number.isFinite(vatPercentage) ||
    vatPercentage < 0 ||
    vatPercentage > 100
  ) {
    alert(
      "VAT percentage must be between 0% and 100%."
    );

    document.getElementById("vat").focus();

    return false;
  }

  return true;
}

// ===============================
// SAVE INVOICE TO SUPABASE
// ===============================

async function saveInvoice() {

  try {

        if (editingInvoiceId) {

      await updateExistingInvoice();

      return;

    }

    if (duplicatingInvoiceId)  {

      duplicatingInvoice = false;

    }

    // -----------------------------
    // UPDATE TOTALS
    // -----------------------------

    updatePreview();

    const totals = calculateTotals();


    // -----------------------------
    // GET LOGGED-IN USER
    // -----------------------------

    const {
      data: {
        user
      },
      error: userError
    } = await supabaseClient.auth.getUser();


    if (userError) {
      throw userError;
    }


    if (!user) {

      alert("Please login again.");

      window.location.href = "login.html";

      return;

    }

        // -----------------------------
    // CHECK SUBSCRIPTION LIMIT
    // -----------------------------

    const {
      data: subscription,
      error: subscriptionError
    } = await supabaseClient
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionError) {
      throw subscriptionError;
    }

    // If no subscription exists, treat the user as Free
    const currentPlan =
      subscription?.plan || "free";

    const currentStatus =
      subscription?.status || "active";

    // Only Free users have the 3 invoice limit
    if (
      currentPlan === "free" &&
      currentStatus === "active"
    ) {

      const firstDayOfMonth = new Date();

      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const nextMonth = new Date(
        firstDayOfMonth
      );

      nextMonth.setMonth(
        nextMonth.getMonth() + 1
      );

      const {
        count: invoiceCount,
        error: invoiceCountError
      } = await supabaseClient
        .from("invoices")
        .select("id", {
          count: "exact",
          head: true
        })
        .eq("user_id", user.id)
        .gte(
          "created_at",
          firstDayOfMonth.toISOString()
        )
        .lt(
          "created_at",
          nextMonth.toISOString()
        );

      if (invoiceCountError) {
        throw invoiceCountError;
      }

      if ((invoiceCount || 0) >= 3) {

        alert(
          "You have reached the Free plan limit of 3 invoices this month. Please upgrade to Pro to create unlimited invoices."
        );

        return;

      }

    }


    console.log(
      "Saving invoice for user:",
      user.id
    );


    // -----------------------------
    // GET FORM VALUES
    // -----------------------------

    const customerName =
      document.getElementById("customerName").value.trim();

    const customerPhone =
      document.getElementById("customerPhone").value.trim();

    const customerEmail =
      document.getElementById("customerEmail").value.trim();

    const customerAddress =
      document.getElementById("customerAddress").value.trim();


    const invoiceNumber =
      document.getElementById("invoiceNumber").value.trim();

    const invoiceDate =
      document.getElementById("invoiceDate").value;

    const dueDate =
      document.getElementById("dueDate").value || null;

    const status =
      document.getElementById("invoiceStatus").value;


    const discountType =
      document.getElementById("discountType").value;

    const discountValue =
      Number(
        document.getElementById("discountValue").value
      ) || 0;


    const vatPercentage =
      Number(
        document.getElementById("vat").value
      ) || 0;


    const notes =
      document.getElementById("notes").value.trim();


    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!validateInvoiceForm()) {

      return;

    }


    if (!invoiceNumber) {

      alert(
        "Please enter an invoice number."
      );

      return;

    }


    if (!invoiceDate) {

      alert(
        "Please select the invoice date."
      );

      return;

    }


    // -----------------------------
    // FIND CUSTOMER
    // -----------------------------

    let customerId = selectedCustomerId || null;


    console.log(
      "Looking for existing customer..."
    );


    if (customerEmail) {

      const {
        data: customersByEmail,
        error: emailError
      } = await supabaseClient

        .from("customers")

        .select("id")

        .eq(
          "user_id",
          user.id
        )

        .eq(
          "email",
          customerEmail
        )

        .limit(1);


      if (emailError) {
        throw emailError;
      }


      if (
        customersByEmail &&
        customersByEmail.length > 0
      ) {

        customerId =
          customersByEmail[0].id;

      }

    }


    // -----------------------------
    // TRY PHONE
    // -----------------------------

    if (
      !customerId &&
      customerPhone
    ) {

      const {
        data: customersByPhone,
        error: phoneError
      } = await supabaseClient

        .from("customers")

        .select("id")

        .eq(
          "user_id",
          user.id
        )

        .eq(
          "phone",
          customerPhone
        )

        .limit(1);


      if (phoneError) {
        throw phoneError;
      }


      if (
        customersByPhone &&
        customersByPhone.length > 0
      ) {

        customerId =
          customersByPhone[0].id;

      }

    }


    // -----------------------------
    // CREATE CUSTOMER
    // -----------------------------

    if (!customerId) {

      console.log(
        "Customer not found. Creating customer..."
      );


      const {
        data: newCustomer,
        error: customerError
      } = await supabaseClient

        .from("customers")

        .insert({

          user_id: user.id,

          name: customerName,

          phone: customerPhone,

          email: customerEmail,

          address: customerAddress

        })

        .select("id")

        .single();


      if (customerError) {
        throw customerError;
      }


      customerId =
        newCustomer.id;


      console.log(
        "Customer created:",
        customerId
      );

    } else {

      console.log(
        "Existing customer found:",
        customerId
      );

    }


    // -----------------------------
    // CREATE INVOICE ID
    // -----------------------------

    const invoiceId =
      crypto.randomUUID();


    // -----------------------------
    // CREATE INVOICE DATA
    // -----------------------------

    const invoiceData = {

      id: invoiceId,

      user_id: user.id,

      customer_id: customerId,

      invoice_number: invoiceNumber,

      issue_date: invoiceDate,

      due_date: dueDate,

      status: status,

      subtotal: totals.subtotal,

      discount_type: discountType,

      discount_value: discountValue,

      vat_percentage: vatPercentage,

      vat_amount: totals.vat,

      // IMPORTANT:
      // Your Supabase column is "total"

      total: totals.total,

      notes: notes

    };


    console.log(
      "Invoice data:",
      invoiceData
    );


    // -----------------------------
    // SAVE INVOICE
    // -----------------------------

    console.log(
      "Creating invoice..."
    );


    const {
      data: savedInvoice,
      error: invoiceError
    } = await supabaseClient

      .from("invoices")

      .insert(invoiceData)

      .select("id")

      .single();


    if (invoiceError) {

      console.error(
        "Invoice database error:",
        invoiceError
      );

      throw invoiceError;

    }


    console.log(
      "Invoice created:",
      savedInvoice.id
    );


    // -----------------------------
    // CREATE INVOICE ITEMS
    // -----------------------------

    const invoiceItems =
      items

        .filter(function(item) {

          return (
            item.description &&
            item.description.trim() !== ""
          );

        })

        .map(function(item) {

          const quantity =
            Number(item.quantity) || 0;

          const unitPrice =
            Number(item.price) || 0;


          return {

            invoice_id:
              savedInvoice.id,

            description:
              item.description.trim(),

            quantity:
              quantity,

            unit_price:
              unitPrice,

            total:
              quantity * unitPrice

          };

        });


    console.log(
      "Invoice items:",
      invoiceItems
    );


    // -----------------------------
    // SAVE INVOICE ITEMS
    // -----------------------------

    if (
      invoiceItems.length > 0
    ) {

      const {
        error: itemsError
      } = await supabaseClient

        .from("invoice_items")

        .insert(invoiceItems);


      if (itemsError) {

        console.error(
          "Invoice items database error:",
          itemsError
        );

        throw itemsError;

      }

    }


    // -----------------------------
    // SAVE LOCAL COPY
    // -----------------------------

    const savedLocalInvoice = {

      invoiceId:
        savedInvoice.id,

      business: {

        name:
          document
            .getElementById("businessName")
            .value,

        phone:
          document
            .getElementById("businessPhone")
            .value,

        email:
          document
            .getElementById("businessEmail")
            .value,

        address:
          document
            .getElementById("businessAddress")
            .value

      },

      customer: {

        name:
          customerName,

        phone:
          customerPhone,

        email:
          customerEmail,

        address:
          customerAddress

      },

      invoiceNumber:
        invoiceNumber,

      invoiceDate:
        invoiceDate,

      dueDate:
        dueDate,

      status:
        status,

      items:
        items,

      totals:
        totals,

      notes:
        notes,

      savedAt:
        new Date().toISOString()

    };


    localStorage.setItem(
      "naijaInvoice",
      JSON.stringify(
        savedLocalInvoice
      )
    );


    // -----------------------------
    // SUCCESS
    // -----------------------------

    alert(
      "Invoice saved successfully!"
    );


    console.log(
      "Invoice saved successfully!"
    );


    console.log(
      "Invoice ID:",
      savedInvoice.id
    );


    console.log(
      "Customer ID:",
      customerId
    );


  } catch (error) {

    console.error(
      "Save invoice error:",
      error
    );


    alert(
      "Unable to save invoice:\n\n" +
      error.message
    );

  }

}

// ===============================
// LOAD SAVED INVOICE
// ===============================

function loadSavedInvoice() {

  const saved =
    localStorage.getItem("naijaInvoice");

  if (!saved) return;

  const data =
    JSON.parse(saved);


  document.getElementById(
    "businessName"
  ).value = data.business.name || "";


  document.getElementById(
    "businessPhone"
  ).value = data.business.phone || "";


  document.getElementById(
    "businessEmail"
  ).value = data.business.email || "";


  document.getElementById(
    "businessAddress"
  ).value = data.business.address || "";


  document.getElementById(
    "customerName"
  ).value = data.customer.name || "";


  document.getElementById(
    "customerPhone"
  ).value = data.customer.phone || "";


  document.getElementById(
    "customerEmail"
  ).value = data.customer.email || "";


  document.getElementById(
    "customerAddress"
  ).value = data.customer.address || "";


  document.getElementById(
    "invoiceNumber"
  ).value = data.invoiceNumber || "NIM-0001";


  document.getElementById(
    "invoiceDate"
  ).value = data.invoiceDate || "";


  document.getElementById(
    "dueDate"
  ).value = data.dueDate || "";


  document.getElementById(
    "invoiceStatus"
  ).value = data.status || "Unpaid";


  document.getElementById(
    "bankName"
  ).value = data.payment.bank || "";


  document.getElementById(
    "accountName"
  ).value = data.payment.accountName || "";


  document.getElementById(
    "accountNumber"
  ).value = data.payment.accountNumber || "";


  document.getElementById(
    "notes"
  ).value = data.notes || "";


  items = data.items || items;


  renderItems();

  updatePreview();

}


// ===============================
// SECURITY / HTML ESCAPE
// ===============================

function escapeHTML(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
// ========================================
// LOGOUT
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    const logoutBtn = document.getElementById("logoutBtn");

    if (!logoutBtn) {
        console.log("Logout button not found");
        return;
    }

    console.log("Logout button found");

    logoutBtn.addEventListener("click", async function () {

        console.log("Logout button clicked");

        logoutBtn.disabled = true;
        logoutBtn.textContent = "Logging out...";

        try {

            const { error } = await supabaseClient.auth.signOut();

            if (error) {
                console.error("Supabase logout error:", error);
                alert("Logout failed: " + error.message);

                logoutBtn.disabled = false;
                logoutBtn.textContent = "Logout";

                return;
            }

            console.log("Successfully logged out");

            window.location.href = "login.html";

        } catch (error) {

            console.error("Logout error:", error);

            alert("Something went wrong while logging out.");

            logoutBtn.disabled = false;
            logoutBtn.textContent = "Logout";
        }

    });

});

// ========================================
// UPDATE EXISTING INVOICE
// ========================================

async function updateExistingInvoice() {

  try {

    updatePreview();

    const totals =
      calculateTotals();


    // --------------------------------------
    // GET USER
    // --------------------------------------

    const {
      data: {
        user
      },
      error: userError
    } =
      await supabaseClient.auth.getUser();


    if (userError) {
      throw userError;
    }


    if (!user) {

      alert(
        "Please login again."
      );

      window.location.href =
        "login.html";

      return;

    }


    // --------------------------------------
    // GET FORM VALUES
    // --------------------------------------

    const customerName =
      document.getElementById(
        "customerName"
      ).value.trim();

    const customerPhone =
      document.getElementById(
        "customerPhone"
      ).value.trim();

    const customerEmail =
      document.getElementById(
        "customerEmail"
      ).value.trim();

    const customerAddress =
      document.getElementById(
        "customerAddress"
      ).value.trim();


    const invoiceNumber =
      document.getElementById(
        "invoiceNumber"
      ).value.trim();

    const invoiceDate =
      document.getElementById(
        "invoiceDate"
      ).value;

    const dueDate =
      document.getElementById(
        "dueDate"
      ).value || null;

    const status =
      document.getElementById(
        "invoiceStatus"
      ).value;


    const discountType =
      document.getElementById(
        "discountType"
      ).value;

    const discountValue =
      Number(
        document.getElementById(
          "discountValue"
        ).value
      ) || 0;


    const vatPercentage =
      Number(
        document.getElementById(
          "vat"
        ).value
      ) || 0;


    const notes =
      document.getElementById(
        "notes"
      ).value.trim();


    // --------------------------------------
    // VALIDATION
    // --------------------------------------

    if (!validateInvoiceForm()) {

      return;

    }


    if (!invoiceNumber) {

      alert(
        "Please enter an invoice number."
      );

      return;

    }


    if (!invoiceDate) {

      alert(
        "Please select the invoice date."
      );

      return;

    }


    // --------------------------------------
    // UPDATE CUSTOMER
    // --------------------------------------

    let customerId =
      selectedCustomerId || null;


    if (customerId) {

      const {
        error: customerUpdateError
      } =
        await supabaseClient
          .from("customers")
          .update({

            name:
              customerName,

            phone:
              customerPhone,

            email:
              customerEmail,

            address:
              customerAddress

          })
          .eq(
            "id",
            customerId
          )
          .eq(
            "user_id",
            user.id
          );


      if (customerUpdateError) {
        throw customerUpdateError;
      }

    } else {

      const {
        data: newCustomer,
        error: customerError
      } =
        await supabaseClient
          .from("customers")
          .insert({

            user_id:
              user.id,

            name:
              customerName,

            phone:
              customerPhone,

            email:
              customerEmail,

            address:
              customerAddress

          })
          .select("id")
          .single();


      if (customerError) {
        throw customerError;
      }


      customerId =
        newCustomer.id;

    }


    // --------------------------------------
    // UPDATE INVOICE
    // --------------------------------------

    const {
      error: invoiceError
    } =
      await supabaseClient
        .from("invoices")
        .update({

          customer_id:
            customerId,

          invoice_number:
            invoiceNumber,

          issue_date:
            invoiceDate,

          due_date:
            dueDate,

          status:
            status,

          subtotal:
            totals.subtotal,

          discount_type:
            discountType,

          discount_value:
            discountValue,

          vat_percentage:
            vatPercentage,

          vat_amount:
            totals.vat,

          total:
            totals.total,

          notes:
            notes

        })
        .eq(
          "id",
          editingInvoiceId
        )
        .eq(
          "user_id",
          user.id
        );


    if (invoiceError) {
      throw invoiceError;
    }


    // --------------------------------------
    // DELETE OLD ITEMS
    // --------------------------------------

    const {
      error: deleteItemsError
    } =
      await supabaseClient
        .from("invoice_items")
        .delete()
        .eq(
          "invoice_id",
          editingInvoiceId
        );


    if (deleteItemsError) {
      throw deleteItemsError;
    }


    // --------------------------------------
    // CREATE UPDATED ITEMS
    // --------------------------------------

    const invoiceItems =
      items
        .filter(function(item) {

          return (
            item.description &&
            item.description.trim() !== ""
          );

        })
        .map(function(item) {

          const quantity =
            Number(item.quantity) || 0;

          const unitPrice =
            Number(item.price) || 0;


          return {

            invoice_id:
              editingInvoiceId,

            description:
              item.description.trim(),

            quantity:
              quantity,

            unit_price:
              unitPrice,

            total:
              quantity * unitPrice

          };

        });


    // --------------------------------------
    // SAVE UPDATED ITEMS
    // --------------------------------------

    if (
      invoiceItems.length > 0
    ) {

      const {
        error: itemsError
      } =
        await supabaseClient
          .from("invoice_items")
          .insert(
            invoiceItems
          );


      if (itemsError) {
        throw itemsError;
      }

    }


    // --------------------------------------
    // SUCCESS
    // --------------------------------------

    alert(
      "Invoice updated successfully!"
    );


    console.log(
      "Invoice updated:",
      editingInvoiceId
    );


    // Go back to saved invoice
    window.location.href =
      "invoice-view.html?id=" +
      encodeURIComponent(
        editingInvoiceId
      );


  } catch (error) {

    console.error(
      "Update invoice error:",
      error
    );


    alert(
      "Unable to update invoice:\n\n" +
      error.message
    );

  }

}
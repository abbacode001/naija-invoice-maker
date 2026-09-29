// ======================================
// NAIJA INVOICE MAKER - DASHBOARD
// ======================================


// --------------------------------------
// CHECK LOGIN
// --------------------------------------

async function checkUser() {

  const {
    data: {
      user
    },
    error
  } = await supabaseClient.auth.getUser();


  if (error || !user) {

    window.location.href = "login.html";

    return null;

  }


  return user;

}


// --------------------------------------
// FORMAT NAIRA
// --------------------------------------

function formatNaira(amount) {

  return new Intl.NumberFormat(
    "en-NG",
    {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2
    }
  ).format(
    Number(amount) || 0
  );

}


// --------------------------------------
// FORMAT DATE
// --------------------------------------

function formatDashboardDate(date) {

  if (!date) {
    return "-";
  }


  return new Date(date).toLocaleDateString(
    "en-NG",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );

}


// --------------------------------------
// SHOW ERROR
// --------------------------------------

function showError(message) {

  const errorElement =
    document.getElementById("errorMessage");


  errorElement.textContent =
    message;


  errorElement.style.display =
    "block";

}


// --------------------------------------
// LOAD DASHBOARD
// --------------------------------------

async function loadDashboard() {

  try {

    const user =
      await checkUser();


    if (!user) {
      return;
    }


    // --------------------------------
    // WELCOME MESSAGE
    // --------------------------------

    const welcomeText =
      document.getElementById(
        "welcomeText"
      );


    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      "there";


    welcomeText.textContent =
      `Welcome back, ${displayName}!`;


    // --------------------------------
    // LOAD INVOICES
    // --------------------------------

    const {
      data: invoices,
      error: invoiceError
    } = await supabaseClient

      .from("invoices")

      .select(`
        id,
        invoice_number,
        issue_date,
        due_date,
        status,
        total,
        customer_id,
        customers (
          name
        )
      `)

      .eq(
        "user_id",
        user.id
      )

      .order(
        "created_at",
        {
          ascending: false
        }
      );


    if (invoiceError) {

      console.error(
        invoiceError
      );

      throw invoiceError;

    }


    // --------------------------------
    // LOAD CUSTOMERS
    // --------------------------------

    const {
      count: customerCount,
      error: customerError
    } = await supabaseClient

      .from("customers")

      .select(
        "id",
        {
          count: "exact",
          head: true
        }
      )

      .eq(
        "user_id",
        user.id
      );


    if (customerError) {

      console.error(
        customerError
      );

      throw customerError;

    }


    // --------------------------------
    // CALCULATE STATISTICS
    // --------------------------------

    const invoiceList =
      invoices || [];


    let paidAmount = 0;

    let unpaidAmount = 0;

    let overdueAmount = 0;

    let paidCount = 0;

    let unpaidCount = 0;

    let overdueCount = 0;


    invoiceList.forEach(
      function(invoice) {

        const amount =
          Number(
            invoice.total
          ) || 0;


        const status =
          String(
            invoice.status || ""
          ).toLowerCase();


        if (status === "paid") {

  paidAmount += amount;

  paidCount++;

} else if (status === "overdue") {

  overdueAmount += amount;

  overdueCount++;

} else {

  unpaidAmount += amount;

  unpaidCount++;

}

  } 
      );



    // --------------------------------
    // DISPLAY STATISTICS
    // --------------------------------

    document.getElementById(
      "totalInvoices"
    ).textContent =
      invoiceList.length;


    document.getElementById(
      "paidAmount"
    ).textContent =
      formatNaira(
        paidAmount
      );


    document.getElementById(
      "unpaidAmount"
    ).textContent =
      formatNaira(
        unpaidAmount
      );

      document.getElementById(
  "overdueAmount"
).textContent =
  formatNaira(
    overdueAmount
  );

  document.getElementById(
  "paidCount"
).textContent =
  paidCount +
  (paidCount === 1
    ? " paid invoice"
    : " paid invoices");

document.getElementById(
  "unpaidCount"
).textContent =
  unpaidCount +
  (unpaidCount === 1
    ? " unpaid invoice"
    : " unpaid invoices");

document.getElementById(
  "overdueCount"
).textContent =
  overdueCount +
  (overdueCount === 1
    ? " overdue invoice"
    : " overdue invoices");


    document.getElementById(
      "totalCustomers"
    ).textContent =
      customerCount || 0;


    // --------------------------------
    // DISPLAY INVOICES
    // --------------------------------

    displayInvoices(
      invoiceList
    );


  } catch (error) {

    console.error(
      "Dashboard error:",
      error
    );


    showError(
      "Unable to load dashboard: " +
      error.message
    );


  }

}


// --------------------------------------
// DISPLAY INVOICES
// --------------------------------------

function displayInvoices(
  invoices
) {

  const loading =
    document.getElementById(
      "loading"
    );


  const emptyState =
    document.getElementById(
      "emptyState"
    );


  const tableContainer =
    document.getElementById(
      "invoiceTableContainer"
    );


  const tableBody =
    document.getElementById(
      "invoiceTableBody"
    );


  loading.style.display =
    "none";


  // No invoices

  if (
    !invoices ||
    invoices.length === 0
  ) {

    emptyState.style.display =
      "block";

    tableContainer.style.display =
      "none";

    return;

  }


  // Show table

  emptyState.style.display =
    "none";

  tableContainer.style.display =
    "block";


  // Only show latest 10

  const recentInvoices =
    invoices.slice(
      0,
      10
    );


  tableBody.innerHTML =
    "";


  recentInvoices.forEach(
    function(invoice) {

      const row =
        document.createElement(
          "tr"
        );


      const customerName =
        invoice.customers?.name ||
        "Customer";


      const status =
        String(
          invoice.status || "Unpaid"
        );


      const statusClass =
        status.toLowerCase() === "paid"
          ? "status-paid"
          : status.toLowerCase() === "unpaid"
            ? "status-unpaid"
            : status.toLowerCase() === "overdue"
              ? "status-overdue"
              : "status-default";


      row.innerHTML = `

        <td>
          <span class="invoice-number">
            ${escapeHTML(
              invoice.invoice_number || "-"
            )}
          </span>
        </td>

        <td>
          ${formatDashboardDate(
            invoice.issue_date
          )}
        </td>

        <td>
          <span class="status-badge ${statusClass}">
            ${escapeHTML(status)}
          </span>
        </td>

        <td>
          <strong>
            ${formatNaira(
              invoice.total
            )}
          </strong>
        </td>

      `;

      row.style.cursor = "pointer";

row.addEventListener(
  "click",
  function() {

    window.location.href =
      "invoice-view.html?id=" +
      encodeURIComponent(
        invoice.id
      );

  }
);


      tableBody.appendChild(
        row
      );

    }
  );

}


// --------------------------------------
// ESCAPE HTML
// --------------------------------------

function escapeHTML(value) {

  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


// --------------------------------------
// CREATE INVOICE
// --------------------------------------

function goToCreateInvoice() {

  window.location.href =
    "index.html";

}


// --------------------------------------
// LOGOUT
// --------------------------------------

async function logout() {

  try {

    const {
      error
    } = await supabaseClient.auth.signOut();


    if (error) {

      throw error;

    }


    window.location.href =
      "login.html";


  } catch (error) {

    console.error(
      "Logout error:",
      error
    );


    alert(
      "Unable to logout: " +
      error.message
    );

  }

}


// --------------------------------------
// LOGOUT BUTTON
// --------------------------------------

document.addEventListener(
  "DOMContentLoaded",
  function() {

    const logoutButton =
      document.getElementById(
        "logoutBtn"
      );


    if (logoutButton) {

      logoutButton.addEventListener(
        "click",
        logout
      );

    }


    loadDashboard();

  }
);

// --------------------------------------
// INVOICE SEARCH
// --------------------------------------

document.addEventListener(
  "DOMContentLoaded",
  function() {

    const searchInput =
      document.getElementById(
        "invoiceSearch"
      );

    if (!searchInput) {
      return;
    }

    searchInput.addEventListener(
      "input",
      function() {

        const searchTerm =
          searchInput.value
            .toLowerCase()
            .trim();

        const rows =
          document.querySelectorAll(
            "#invoiceTableBody tr"
          );

        rows.forEach(
          function(row) {

            const rowText =
              row.textContent
                .toLowerCase();

            if (
              rowText.includes(
                searchTerm
              )
            ) {

              row.style.display =
                "";

            } else {

              row.style.display =
                "none";

            }

          }
        );

      }
    );

  }
);
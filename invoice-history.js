// ======================================
// NAIJA INVOICE MAKER
// INVOICE HISTORY
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

    window.location.href =
      "login.html";

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

function formatDate(date) {

  if (!date) {
    return "-";
  }


  return new Date(date)
    .toLocaleDateString(
      "en-NG",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );

}


// --------------------------------------
// ESCAPE HTML
// --------------------------------------

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// --------------------------------------
// SHOW ERROR
// --------------------------------------

function showError(message) {

  const element =
    document.getElementById(
      "errorMessage"
    );


  element.textContent =
    message;


  element.style.display =
    "block";

}


// --------------------------------------
// LOAD INVOICES
// --------------------------------------

let allInvoices = [];


async function loadInvoices() {

  try {

    const user =
      await checkUser();


    if (!user) {
      return;
    }


    const {
      data: invoices,
      error
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


    if (error) {

      console.error(
        "Invoice history error:",
        error
      );

      throw error;

    }


    allInvoices =
      invoices || [];


    displayInvoices(
      allInvoices
    );


  } catch (error) {

    console.error(
      "Unable to load invoices:",
      error
    );


    document.getElementById(
      "loading"
    ).style.display =
      "none";


    showError(
      "Unable to load invoices: " +
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
      "tableContainer"
    );

  const tableBody =
    document.getElementById(
      "invoiceTableBody"
    );

  const resultsInfo =
    document.getElementById(
      "resultsInfo"
    );


  loading.style.display =
    "none";


  tableBody.innerHTML =
    "";


  if (
    !invoices ||
    invoices.length === 0
  ) {

    tableContainer.style.display =
      "none";

    emptyState.style.display =
      "block";

    resultsInfo.textContent =
      "0 invoices";

    return;

  }


  emptyState.style.display =
    "none";

  tableContainer.style.display =
    "block";


  resultsInfo.textContent =
    `${invoices.length} invoice${
      invoices.length === 1
        ? ""
        : "s"
    }`;


  invoices.forEach(
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
          invoice.status ||
          "Unpaid"
        );


      const statusLower =
        status.toLowerCase();


      let statusClass =
        "status-default";


      if (
        statusLower === "paid"
      ) {

        statusClass =
          "status-paid";

      } else if (
        statusLower === "unpaid"
      ) {

        statusClass =
          "status-unpaid";

      } else if (
        statusLower === "overdue"
      ) {

        statusClass =
          "status-overdue";

      } else if (
        statusLower === "draft"
      ) {

        statusClass =
          "status-draft";

      }


      row.innerHTML = `

        <td>

          <span class="invoice-number">

            ${escapeHTML(
              invoice.invoice_number ||
              "-"
            )}

          </span>

        </td>


        <td>

          ${escapeHTML(
            customerName
          )}

        </td>


        <td>

          ${formatDate(
            invoice.issue_date
          )}

        </td>


        <td>

          <strong>

            ${formatNaira(
              invoice.total
            )}

          </strong>

        </td>


        <td>

          <span
            class="status-badge ${statusClass}">

            ${escapeHTML(
              status
            )}

          </span>

        </td>


        <td>

          <div class="action-buttons">

            <button
              type="button"
              class="small-btn"
              onclick="viewInvoice('${invoice.id}')">

              View

            </button>


            <button
              type="button"
              class="small-btn"
              onclick="printInvoice('${invoice.id}')">

              Print

            </button>


            <button
              type="button"
              class="small-btn delete-btn"
              onclick="deleteInvoice('${invoice.id}')">

              Delete

            </button>

          </div>

        </td>

      `;


      tableBody.appendChild(
        row
      );

    }
  );

}


// --------------------------------------
// SEARCH + FILTER
// --------------------------------------

function filterInvoices() {

  const search =
    document.getElementById(
      "searchInput"
    ).value
      .trim()
      .toLowerCase();


  const status =
    document.getElementById(
      "statusFilter"
    ).value;


  const filtered =
    allInvoices.filter(
      function(invoice) {

        const invoiceNumber =
          String(
            invoice.invoice_number ||
            ""
          ).toLowerCase();


        const customerName =
          String(
            invoice.customers?.name ||
            ""
          ).toLowerCase();


        const matchesSearch =
          !search ||
          invoiceNumber.includes(search) ||
          customerName.includes(search);


        const matchesStatus =
          status === "all" ||
          invoice.status === status;


        return (
          matchesSearch &&
          matchesStatus
        );

      }
    );


  displayInvoices(
    filtered
  );

}


// --------------------------------------
// VIEW INVOICE
// --------------------------------------

function viewInvoice(
  invoiceId
) {

  window.location.href =
    "invoice-view.html?id=" +
    encodeURIComponent(
      invoiceId
    );

}


// --------------------------------------
// PRINT INVOICE
// --------------------------------------

function printInvoice(
  invoiceId
) {

  window.location.href =
    "invoice-view.html?id=" +
    encodeURIComponent(
      invoiceId
    ) +
    "&print=true";

}


// --------------------------------------
// DELETE INVOICE
// --------------------------------------

async function deleteInvoice(
  invoiceId
) {

  const confirmed =
    confirm(
      "Are you sure you want to delete this invoice?"
    );


  if (!confirmed) {
    return;
  }


  try {

    const user =
      await checkUser();


    if (!user) {
      return;
    }


    // Delete invoice items first

    const {
      error: itemsError
    } = await supabaseClient

      .from("invoice_items")

      .delete()

      .eq(
        "invoice_id",
        invoiceId
      );


    if (itemsError) {

      console.error(
        "Invoice items delete error:",
        itemsError
      );

      throw itemsError;

    }


    // Delete invoice

    const {
      error: invoiceError
    } = await supabaseClient

      .from("invoices")

      .delete()

      .eq(
        "id",
        invoiceId
      )

      .eq(
        "user_id",
        user.id
      );


    if (invoiceError) {

      console.error(
        "Invoice delete error:",
        invoiceError
      );

      throw invoiceError;

    }


    alert(
      "Invoice deleted successfully."
    );


    await loadInvoices();


  } catch (error) {

    console.error(
      "Delete invoice error:",
      error
    );


    alert(
      "Unable to delete invoice:\n\n" +
      error.message
    );

  }

}


// --------------------------------------
// NAVIGATION
// --------------------------------------

function goToDashboard() {

  window.location.href =
    "dashboard.html";

}


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
// START PAGE
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


    const searchInput =
      document.getElementById(
        "searchInput"
      );


    const statusFilter =
      document.getElementById(
        "statusFilter"
      );


    searchInput.addEventListener(
      "input",
      filterInvoices
    );


    statusFilter.addEventListener(
      "change",
      filterInvoices
    );


    loadInvoices();

  }
);
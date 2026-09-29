// ======================================
// NAIJA INVOICE MAKER
// CUSTOMER MANAGEMENT
// ======================================


let allCustomers = [];


// --------------------------------------
// CHECK USER
// --------------------------------------

async function getCurrentUser() {

  const {
    data: {
      user
    },
    error
  } =
    await supabaseClient.auth.getUser();


  if (error) {
    throw error;
  }


  if (!user) {

    window.location.href =
      "login.html";

    return null;

  }


  return user;

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
// LOAD CUSTOMERS
// --------------------------------------

async function loadCustomers() {

  try {

    const user =
      await getCurrentUser();


    if (!user) {
      return;
    }


    const {
      data,
      error
    } =
      await supabaseClient

        .from("customers")

        .select(`
          id,
          name,
          phone,
          email,
          address
        `)

        .eq(
          "user_id",
          user.id
        )

        .order(
          "name",
          {
            ascending: true
          }
        );


    if (error) {
      throw error;
    }


    allCustomers =
      data || [];


    displayCustomers(
      allCustomers
    );


  } catch (error) {

    console.error(
      "Unable to load customers:",
      error
    );


    document.getElementById(
      "loading"
    ).style.display =
      "none";


    showError(
      "Unable to load customers: " +
      error.message
    );

  }

}


// --------------------------------------
// DISPLAY CUSTOMERS
// --------------------------------------

function displayCustomers(
  customers
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
      "customerTableBody"
    );


  loading.style.display =
    "none";


  tableBody.innerHTML =
    "";


  if (
    !customers ||
    customers.length === 0
  ) {

    tableContainer.style.display =
      "none";

    emptyState.style.display =
      "block";

    return;

  }


  emptyState.style.display =
    "none";

  tableContainer.style.display =
    "block";


  customers.forEach(
    function(customer) {

      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td>

          <span class="customer-name">

            ${escapeHTML(
              customer.name
            )}

          </span>

        </td>


        <td>

          ${escapeHTML(
            customer.phone || "-"
          )}

        </td>


        <td>

          ${escapeHTML(
            customer.email || "-"
          )}

        </td>


        <td>

          ${escapeHTML(
            customer.address || "-"
          )}

        </td>


        <td>

  <div class="action-buttons">

    <button
      type="button"
      class="small-btn"
      onclick="viewCustomer('${customer.id}')">

      View

    </button>


    <button
      type="button"
      class="small-btn"
      onclick="editCustomer('${customer.id}')">

      Edit

    </button>


    <button
      type="button"
      class="small-btn delete-btn"
      onclick="deleteCustomer('${customer.id}')">

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
// SEARCH
// --------------------------------------

function searchCustomers() {

  const search =
    document.getElementById(
      "searchInput"
    ).value
      .trim()
      .toLowerCase();


  if (!search) {

    displayCustomers(
      allCustomers
    );

    return;

  }


  const filtered =
    allCustomers.filter(
      function(customer) {

        return (

          String(
            customer.name || ""
          )
            .toLowerCase()
            .includes(search)

          ||

          String(
            customer.phone || ""
          )
            .toLowerCase()
            .includes(search)

          ||

          String(
            customer.email || ""
          )
            .toLowerCase()
            .includes(search)

        );

      }
    );


  displayCustomers(
    filtered
  );

}


// --------------------------------------
// OPEN ADD CUSTOMER
// --------------------------------------

function openAddCustomer() {

  document.getElementById(
    "modalTitle"
  ).textContent =
    "Add Customer";


  document.getElementById(
    "customerForm"
  ).reset();


  document.getElementById(
    "customerId"
  ).value =
    "";


  document.getElementById(
    "customerModal"
  ).style.display =
    "block";

}


// --------------------------------------
// CLOSE MODAL
// --------------------------------------

function closeCustomerModal() {

  document.getElementById(
    "customerModal"
  ).style.display =
    "none";

}


// --------------------------------------
// SAVE CUSTOMER
// --------------------------------------

async function saveCustomer(
  event
) {

  event.preventDefault();


  try {

    const user =
      await getCurrentUser();


    if (!user) {
      return;
    }


    const customerId =
      document.getElementById(
        "customerId"
      ).value;


    const customerData = {

      name:
        document.getElementById(
          "customerName"
        ).value.trim(),

      phone:
        document.getElementById(
          "customerPhone"
        ).value.trim(),

      email:
        document.getElementById(
          "customerEmail"
        ).value.trim(),

      address:
        document.getElementById(
          "customerAddress"
        ).value.trim()

    };


    if (!customerData.name) {

      alert(
        "Please enter the customer name."
      );

      return;

    }


    // EDIT

    if (customerId) {

      const {
        error
      } =
        await supabaseClient

          .from("customers")

          .update(
            customerData
          )

          .eq(
            "id",
            customerId
          )

          .eq(
            "user_id",
            user.id
          );


      if (error) {
        throw error;
      }


      alert(
        "Customer updated successfully."
      );

    }

    // ADD

    else {

      const {
        error
      } =
        await supabaseClient

          .from("customers")

          .insert({

            ...customerData,

            user_id:
              user.id

          });


      if (error) {
        throw error;
      }


      alert(
        "Customer added successfully."
      );

    }


    closeCustomerModal();

    await loadCustomers();


  } catch (error) {

    console.error(
      "Save customer error:",
      error
    );


    alert(
      "Unable to save customer:\n\n" +
      error.message
    );

  }

}


// --------------------------------------
// EDIT CUSTOMER
// --------------------------------------

function editCustomer(
  customerId
) {

  const customer =
    allCustomers.find(
      function(item) {

        return item.id === customerId;

      }
    );


  if (!customer) {

    alert(
      "Customer not found."
    );

    return;

  }


  document.getElementById(
    "modalTitle"
  ).textContent =
    "Edit Customer";


  document.getElementById(
    "customerId"
  ).value =
    customer.id;


  document.getElementById(
    "customerName"
  ).value =
    customer.name || "";


  document.getElementById(
    "customerPhone"
  ).value =
    customer.phone || "";


  document.getElementById(
    "customerEmail"
  ).value =
    customer.email || "";


  document.getElementById(
    "customerAddress"
  ).value =
    customer.address || "";


  document.getElementById(
    "customerModal"
  ).style.display =
    "block";

}

// --------------------------------------
// VIEW CUSTOMER
// --------------------------------------

function viewCustomer(customerId) {

  const customer =
    allCustomers.find(
      function(item) {

        return item.id === customerId;

      }
    );


  if (!customer) {

    alert(
      "Customer not found."
    );

    return;

  }


  document.getElementById(
    "viewCustomerName"
  ).textContent =
    customer.name || "-";


  document.getElementById(
    "viewCustomerPhone"
  ).textContent =
    customer.phone || "-";


  document.getElementById(
    "viewCustomerEmail"
  ).textContent =
    customer.email || "-";


  document.getElementById(
    "viewCustomerAddress"
  ).textContent =
    customer.address || "-";


  // Load this customer's invoice information
loadCustomerInvoices(
  customer.id
);


document.getElementById(
  "viewCustomerModal"
).style.display =
  "block";

}

// --------------------------------------
// LOAD CUSTOMER INVOICES
// --------------------------------------

async function loadCustomerInvoices(
  customerId
) {

  try {

    const {
  data: invoices,
  error
} =
  await supabaseClient

    .from("invoices")

    .select(`
      id,
      invoice_number,
      status,
      total,
      issue_date,
      customer_id
    `)

    .eq(
      "user_id",
      (await supabaseClient.auth.getUser()).data.user.id
    )

    .eq(
      "customer_id",
      customerId
    )

    .order(
      "issue_date",
      {
        ascending: false
      }
    );

        

    if (error) {
      throw error;
    }


    const invoiceList =
      invoices || [];

      // --------------------------------------
// DISPLAY CUSTOMER INVOICE LIST
// --------------------------------------

const invoiceListElement =
  document.getElementById(
    "customerInvoiceList"
  );


if (invoiceList.length === 0) {

  invoiceListElement.innerHTML =
    "<p>No invoices found for this customer.</p>";

} else {

  invoiceListElement.innerHTML =
    invoiceList.map(
      function(invoice) {

        const status =
          invoice.status || "Unpaid";

        const amount =
          formatNaira(
            invoice.total
          );

        return `

          <a
  href="invoice-view.html?id=${encodeURIComponent(invoice.id)}"
  class="customer-invoice-row"
  style="cursor: pointer; text-decoration: none; color: inherit; display: block;">

            <div>

              <strong>
                ${escapeHTML(
                  invoice.invoice_number || "-"
                )}
              </strong>

              <small>
                ${escapeHTML(
                  invoice.issue_
                )}
              </small>

            </div>

            <div>

              <span>
                ${escapeHTML(
                  status
                )}
              </span>

              <strong>
                ${amount}
              </strong>

            </div>

          </a>

        `;

      }
    ).join("");

}


    let totalInvoiced = 0;
    let paidAmount = 0;
    let unpaidAmount = 0;
    let overdueAmount = 0;


    invoiceList.forEach(
      function(invoice) {

        const amount =
          Number(
            invoice.total
          ) || 0;


        totalInvoiced += amount;


        const status =
          String(
            invoice.status || ""
          ).toLowerCase();


        if (status === "paid") {

          paidAmount += amount;

        } else if (status === "overdue") {

          overdueAmount += amount;

        } else {

          unpaidAmount += amount;

        }

      }
    );


    document.getElementById(
      "customerInvoiceCount"
    ).textContent =
      invoiceList.length;


    document.getElementById(
      "customerTotalInvoiced"
    ).textContent =
      formatNaira(
        totalInvoiced
      );


    document.getElementById(
      "customerPaidAmount"
    ).textContent =
      formatNaira(
        paidAmount
      );


    document.getElementById(
      "customerUnpaidAmount"
    ).textContent =
      formatNaira(
        unpaidAmount
      );


    document.getElementById(
      "customerOverdueAmount"
    ).textContent =
      formatNaira(
        overdueAmount
      );


  } catch (error) {

    console.error(
      "Unable to load customer invoices:",
      error
    );


    document.getElementById(
      "customerInvoiceCount"
    ).textContent =
      "0";


    document.getElementById(
      "customerTotalInvoiced"
    ).textContent =
      "Unable to load";


    document.getElementById(
      "customerPaidAmount"
    ).textContent =
      "₦0.00";


    document.getElementById(
      "customerUnpaidAmount"
    ).textContent =
      "₦0.00";


    document.getElementById(
      "customerOverdueAmount"
    ).textContent =
      "₦0.00";

  }

}

// --------------------------------------
// OPEN CUSTOMER INVOICE
// --------------------------------------

function openCustomerInvoice(
  invoiceId
) {

  if (!invoiceId) {

    alert(
      "Invoice ID is missing."
    );

    return;

  }


  const invoiceURL =
    "invoice-view.html?id=" +
    encodeURIComponent(
      invoiceId
    );


  window.location.assign(
    invoiceURL
  );

}


// --------------------------------------
// CLOSE VIEW CUSTOMER
// --------------------------------------

function closeViewCustomer() {

  document.getElementById(
    "viewCustomerModal"
  ).style.display =
    "none";

}


// --------------------------------------
// DELETE CUSTOMER
// --------------------------------------

async function deleteCustomer(
  customerId
) {

  const customer =
    allCustomers.find(
      function(item) {

        return item.id === customerId;

      }
    );


  const confirmed =
    confirm(
      `Delete customer "${
        customer?.name || "this customer"
      }"?`
    );


  if (!confirmed) {
    return;
  }


  try {

    const user =
      await getCurrentUser();


    if (!user) {
      return;
    }


    const {
      error
    } =
      await supabaseClient

        .from("customers")

        .delete()

        .eq(
          "id",
          customerId
        )

        .eq(
          "user_id",
          user.id
        );


    if (error) {
      throw error;
    }


    alert(
      "Customer deleted successfully."
    );


    await loadCustomers();


  } catch (error) {

    console.error(
      "Delete customer error:",
      error
    );


    alert(
      "Unable to delete customer:\n\n" +
      error.message
    );

  }

}


// --------------------------------------
// ERROR
// --------------------------------------

function showError(
  message
) {

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
// NAVIGATION
// --------------------------------------

function goToDashboard() {

  window.location.href =
    "dashboard.html";

}


function goToHistory() {

  window.location.href =
    "invoice-history.html";

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
    } =
      await supabaseClient.auth.signOut();


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
// START
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


    document.getElementById(
      "searchInput"
    ).addEventListener(
      "input",
      searchCustomers
    );


    document.getElementById(
      "customerForm"
    ).addEventListener(
      "submit",
      saveCustomer
    );


    loadCustomers();

  }
);
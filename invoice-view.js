// ======================================
// NAIJA INVOICE MAKER
// SAVED INVOICE VIEW
// ======================================


// --------------------------------------
// GET INVOICE ID FROM URL
// --------------------------------------

const urlParams =
  new URLSearchParams(
    window.location.search
  );

const invoiceId =
  urlParams.get("id");


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

  const errorElement =
    document.getElementById(
      "errorMessage"
    );

  errorElement.textContent =
    message;

  errorElement.style.display =
    "block";

}


// --------------------------------------
// LOAD INVOICE
// --------------------------------------

async function loadInvoice() {

  try {

    if (!invoiceId) {

      throw new Error(
        "Invoice ID is missing."
      );

    }


    // -------------------------------
    // CHECK LOGIN
    // -------------------------------

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


    // -------------------------------
    // GET INVOICE
    // -------------------------------

    const {
      data: invoice,
      error: invoiceError
    } =
      await supabaseClient

        .from("invoices")

        .select(`
          id,
          user_id,
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
          customer_id,
          customers (
            name,
            phone,
            email,
            address
          )
        `)

        .eq(
          "id",
          invoiceId
        )

        .eq(
          "user_id",
          user.id
        )

        .single();


    if (invoiceError) {
      throw invoiceError;
    }

    // --------------------------------------
// AUTOMATIC OVERDUE CHECK
// --------------------------------------

if (
  invoice.status === "Unpaid" &&
  invoice.due_date
) {

  const today = new Date()
    .toISOString()
    .split("T")[0];

  if (invoice.due_date < today) {

    console.log(
      "Invoice is overdue. Updating status..."
    );

    const { error: overdueError } =
      await supabaseClient
        .from("invoices")
        .update({
          status: "Overdue"
        })
        .eq("id", invoice.id);

    if (overdueError) {

      console.error(
        "Unable to update overdue status:",
        overdueError
      );

    } else {

      invoice.status = "Overdue";

      console.log(
        "Invoice marked as Overdue."
      );

    }

  }

}


    // -------------------------------
    // GET ITEMS
    // -------------------------------

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


    // -------------------------------
    // GET BUSINESS INFORMATION
    // -------------------------------

    const {
      data: business,
      error: businessError
    } =
      await supabaseClient

        .from("businesses")

        .select("*")

        .eq(
          "user_id",
          user.id
        )

        .maybeSingle();


    if (businessError) {
      throw businessError;
    }


    // -------------------------------
    // DISPLAY BUSINESS
    // -------------------------------

    document.getElementById(
      "businessName"
    ).textContent =
      business?.business_name ||
      "Your Business";


    const businessDetails = [];


    if (business?.phone) {

      businessDetails.push(
        business.phone
      );

    }


    if (business?.email) {

      businessDetails.push(
        business.email
      );

    }


    if (business?.address) {

      businessDetails.push(
        business.address
      );

    }


    document.getElementById(
      "businessDetails"
    ).innerHTML =
      businessDetails
        .map(
          value =>
            escapeHTML(value)
        )
        .join("<br>");


    // -------------------------------
// DISPLAY BUSINESS LOGO
// -------------------------------

const businessLogo =
  document.getElementById(
    "businessLogo"
  );

if (
  businessLogo &&
  business?.logo_url
) {

  businessLogo.src =
    business.logo_url;

  businessLogo.style.display =
    "block";

} else if (businessLogo) {

  businessLogo.src = "";

  businessLogo.style.display =
    "none";

}


    // -------------------------------
    // INVOICE INFORMATION
    // -------------------------------

    document.getElementById(
      "invoiceNumber"
    ).textContent =
      "Invoice #" +
      (
        invoice.invoice_number ||
        ""
      );


    document.getElementById(
      "invoiceDate"
    ).textContent =
      formatDate(
        invoice.issue_date
      );


    document.getElementById(
      "dueDate"
    ).textContent =
      formatDate(
        invoice.due_date
      );


    // -------------------------------
    // CUSTOMER
    // -------------------------------

    const customer =
      invoice.customers;


    document.getElementById(
      "customerDetails"
    ).innerHTML = `

      <strong>
        ${escapeHTML(
          customer?.name ||
          "Customer"
        )}
      </strong>

      ${
        customer?.phone
          ? `<br>${escapeHTML(
              customer.phone
            )}`
          : ""
      }

      ${
        customer?.email
          ? `<br>${escapeHTML(
              customer.email
            )}`
          : ""
      }

      ${
        customer?.address
          ? `<br>${escapeHTML(
              customer.address
            )}`
          : ""
      }

    `;


    // -------------------------------
    // STATUS
    // -------------------------------

    const status =
      invoice.status ||
      "Unpaid";


    const statusClass =
      status.toLowerCase();


    document.getElementById(
      "invoiceStatus"
    ).innerHTML = `

      <span class="status status-${escapeHTML(
        statusClass
      )}">

        ${escapeHTML(status)}

      </span>

    `;


    // -------------------------------
    // ITEMS
    // -------------------------------

    const itemsBody =
      document.getElementById(
        "itemsBody"
      );


    itemsBody.innerHTML =
      "";


    (invoiceItems || [])
      .forEach(
        function(item) {

          const row =
            document.createElement(
              "tr"
            );


          row.innerHTML = `

            <td>
              ${escapeHTML(
                item.description
              )}
            </td>

            <td class="text-right">
              ${Number(
                item.quantity
              )}
            </td>

            <td class="text-right">
              ${formatNaira(
                item.unit_price
              )}
            </td>

            <td class="text-right">
              ${formatNaira(
                item.total
              )}
            </td>

          `;


          itemsBody.appendChild(
            row
          );

        }
      );


    // -------------------------------
    // TOTALS
    // -------------------------------

    document.getElementById(
      "subtotal"
    ).textContent =
      formatNaira(
        invoice.subtotal
      );


    let discountAmount = 0;


    if (
      invoice.discount_type ===
      "percentage"
    ) {

      discountAmount =
        (
          Number(invoice.subtotal) *
          Number(invoice.discount_value)
        ) / 100;

    } else if (
      invoice.discount_type ===
      "fixed"
    ) {

      discountAmount =
        Number(
          invoice.discount_value
        );

    }


    document.getElementById(
      "discount"
    ).textContent =
      "- " +
      formatNaira(
        discountAmount
      );


    document.getElementById(
      "vatLabel"
    ).textContent =
      "VAT (" +
      Number(
        invoice.vat_percentage || 0
      ) +
      "%)";


    document.getElementById(
      "vat"
    ).textContent =
      formatNaira(
        invoice.vat_amount
      );


    document.getElementById(
      "total"
    ).textContent =
      formatNaira(
        invoice.total
      );


    // -------------------------------
    // NOTES
    // -------------------------------

    const notesSection =
      document.getElementById(
        "notesSection"
      );


    if (invoice.notes) {

      document.getElementById(
        "notes"
      ).textContent =
        invoice.notes;

    } else {

      notesSection.style.display =
        "none";

    }


    // -------------------------------
    // SHOW INVOICE
    // -------------------------------

    document.getElementById(
      "loading"
    ).style.display =
      "none";


    document.getElementById(
      "invoicePaper"
    ).style.display =
      "block";


    // -------------------------------
    // AUTO PRINT
    // -------------------------------

    if (
      urlParams.get("print") ===
      "true"
    ) {

      setTimeout(
        function() {

          window.print();

        },
        500
      );

    }

  } catch (error) {

    console.error(
      "Unable to load invoice:",
      error
    );


    document.getElementById(
      "loading"
    ).style.display =
      "none";


    showError(
      "Unable to load invoice: " +
      error.message
    );

  }

}


// --------------------------------------
// PRINT
// --------------------------------------

function printInvoice() {

  window.print();

}
// --------------------------------------
// WHATSAPP SHARE
// --------------------------------------

function shareInvoiceWhatsApp() {

  const invoiceNumber =
    document.getElementById("invoiceNumber").textContent.trim();

  const customerDetails =
    document.getElementById("customerDetails").textContent.trim();

  const totalAmount =
    document.getElementById("total").textContent.trim();

  const message =
    `Hello ${customerDetails},\n\n` +
    `Please find your invoice ${invoiceNumber}.\n` +
    `Total Amount: ${totalAmount}\n\n` +
    `Thank you for your business.`;

  const whatsappURL =
    "https://wa.me/?text=" +
    encodeURIComponent(message);

  window.open(
    whatsappURL,
    "_blank"
  );

}


// --------------------------------------
// BACK
// --------------------------------------

function goBack() {

  window.history.back();

}


// --------------------------------------
// HISTORY
// --------------------------------------

function goToHistory() {

  window.location.href =
    "invoice-history.html";

}


// --------------------------------------
// START
// --------------------------------------

document.addEventListener(
  "DOMContentLoaded",
  function() {

    loadInvoice();

  }
);

// --------------------------------------
// MARK INVOICE AS PAID
// --------------------------------------

async function markInvoiceAsPaid() {

  if (!invoiceId) {
    alert("Invoice ID not found.");
    return;
  }

  const confirmPaid = confirm(
    "Are you sure you want to mark this invoice as paid?"
  );

  if (!confirmPaid) {
    return;
  }

  try {

    const { error } = await supabaseClient
      .from("invoices")
      .update({
        status: "Paid"
      })
      .eq("id", invoiceId);

    if (error) {
      console.error("Error marking invoice as paid:", error);
      alert("Unable to mark invoice as paid.");
      return;
    }

    alert("Invoice marked as paid successfully.");

    // Reload the invoice so the status changes immediately
    await loadInvoice();

  } catch (error) {

    console.error("Unexpected error:", error);
    alert("Something went wrong while updating the invoice.");

  }

}

// --------------------------------------
// EDIT INVOICE
// --------------------------------------

function editInvoice() {

  if (!invoiceId) {

    alert("Invoice ID not found.");

    return;

  }

  window.location.href =
    "index.html?edit=" +
    encodeURIComponent(invoiceId);

}

// ========================================
// DUPLICATE INVOICE
// ========================================

function duplicateInvoice() {

  if (!invoiceId) {
    alert("Invoice ID not found.");
    return;
  }

  const confirmDuplicate =
    confirm(
      "Do you want to duplicate this invoice?"
    );

  if (!confirmDuplicate) {
    return;
  }

  window.location.href =
    "index.html?duplicate=" +
    encodeURIComponent(invoiceId);
}
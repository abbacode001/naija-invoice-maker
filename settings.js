// ======================================
// NAIJA INVOICE MAKER - SETTINGS
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
// SHOW MESSAGE
// --------------------------------------

function showMessage(
  message,
  type
) {

  const messageElement =
    document.getElementById(
      "settingsMessage"
    );


  messageElement.textContent =
    message;


  messageElement.className =
    "settings-message " + type;


  messageElement.style.display =
    "block";


  setTimeout(
    function() {

      messageElement.style.display =
        "none";

    },
    4000
  );

}


// --------------------------------------
// LOAD BUSINESS SETTINGS
// --------------------------------------

async function loadSettings() {

  try {

    const user =
      await checkUser();


    if (!user) {
      return;
    }


    const {
      data: business,
      error
    } = await supabaseClient

      .from("businesses")

      .select(`
        business_name,
        contact_name,
        logo_url,
        phone,
        email,
        address,
        bank_name,
        account_name,
        account_number,
        invoice_prefix,
        default_vat,
        default_notes
      `)

      .eq(
        "user_id",
        user.id
      )

      .maybeSingle();


    if (error) {

      console.error(
        "Load settings error:",
        error
      );

      throw error;

    }


    if (!business) {

      console.log(
        "No business profile found yet."
      );

      return;

    }


    // --------------------------------
    // BUSINESS INFORMATION
    // --------------------------------

    document.getElementById(
      "businessName"
    ).value =
      business.business_name || "";


    document.getElementById(
      "contactName"
    ).value =
      business.contact_name || "";


    document.getElementById(
      "businessPhone"
    ).value =
      business.phone || "";


    document.getElementById(
      "businessEmail"
    ).value =
      business.email || "";


    document.getElementById(
      "businessAddress"
    ).value =
      business.address || "";


    // --------------------------------
    // INVOICE SETTINGS
    // --------------------------------

    document.getElementById(
      "invoicePrefix"
    ).value =
      business.invoice_prefix || "NIM";


    document.getElementById(
      "defaultVat"
    ).value =
      business.default_vat ?? 0;


    document.getElementById(
      "defaultNotes"
    ).value =
      business.default_notes || "";


    // --------------------------------
    // BANK DETAILS
    // --------------------------------

    document.getElementById(
      "bankName"
    ).value =
      business.bank_name || "";


    document.getElementById(
      "accountName"
    ).value =
      business.account_name || "";


    document.getElementById(
      "accountNumber"
    ).value =
      business.account_number || "";


    // --------------------------------
    // LOGO
    // --------------------------------

    if (business.logo_url) {

      const logoPreview =
        document.getElementById(
          "logoPreview"
        );


      logoPreview.innerHTML = `

        <img
          src="${business.logo_url}"
          alt="Business Logo">

      `;

    }


  } catch (error) {

    console.error(
      "Settings error:",
      error
    );


    showMessage(
      "Unable to load settings: " +
      error.message,
      "error"
    );

  }

}


// --------------------------------------
// SAVE BUSINESS SETTINGS
// --------------------------------------

async function saveSettings() {

  try {

    const user =
      await checkUser();


    if (!user) {
      return;
    }


    // --------------------------------
    // GET FORM VALUES
    // --------------------------------

    const businessName =
      document.getElementById(
        "businessName"
      ).value.trim();


    const contactName =
      document.getElementById(
        "contactName"
      ).value.trim();


    const phone =
      document.getElementById(
        "businessPhone"
      ).value.trim();


    const email =
      document.getElementById(
        "businessEmail"
      ).value.trim();


    const address =
      document.getElementById(
        "businessAddress"
      ).value.trim();


    const invoicePrefix =
      document.getElementById(
        "invoicePrefix"
      ).value.trim().toUpperCase();


    const defaultVat =
      Number(
        document.getElementById(
          "defaultVat"
        ).value
      ) || 0;


    const defaultNotes =
      document.getElementById(
        "defaultNotes"
      ).value.trim();


    const bankName =
      document.getElementById(
        "bankName"
      ).value.trim();


    const accountName =
      document.getElementById(
        "accountName"
      ).value.trim();


    const accountNumber =
      document.getElementById(
        "accountNumber"
      ).value.trim();


    // --------------------------------
    // VALIDATION
    // --------------------------------

    if (!businessName) {

      showMessage(
        "Please enter your business name.",
        "error"
      );

      return;

    }


    if (!invoicePrefix) {

      showMessage(
        "Please enter an invoice prefix.",
        "error"
      );

      return;

    }


    if (
      defaultVat < 0 ||
      defaultVat > 100
    ) {

      showMessage(
        "VAT must be between 0 and 100.",
        "error"
      );

      return;

    }


    // --------------------------------
    // SAVE TO SUPABASE
    // --------------------------------

    const {
  error
} = await supabaseClient
  .from("businesses")
  .update({
    business_name: businessName,
    contact_name: contactName,
    phone: phone,
    email: email,
    address: address,
    bank_name: bankName,
    account_name: accountName,
    account_number: accountNumber,
    invoice_prefix: invoicePrefix,
    default_vat: defaultVat,
    default_notes: defaultNotes
  })
  .eq("user_id", user.id);

    if (error) {

      console.error(
        "Save settings error:",
        error
      );

      throw error;

    }


    showMessage(
      "Settings saved successfully!",
      "success"
    );


  } catch (error) {

    console.error(
      "Settings error:",
      error
    );


    showMessage(
      "Unable to save settings: " +
      error.message,
      "error"
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


function goToCustomers() {

  window.location.href =
    "customers.html";

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
// PAGE START
// --------------------------------------

document.addEventListener(
  "DOMContentLoaded",
  function() {


    const saveButton =
      document.getElementById(
        "saveSettingsBtn"
      );


    const logoutButton =
      document.getElementById(
        "logoutBtn"
      );


    if (saveButton) {

      saveButton.addEventListener(
        "click",
        saveSettings
      );

    }


    if (logoutButton) {

      logoutButton.addEventListener(
        "click",
        logout
      );

    }


    loadSettings();

  }
);

// ======================================
// LOGO UPLOAD
// ======================================

async function uploadLogo() {

  try {

    const user = await checkUser();

    if (!user) {
      return;
    }

    const logoInput =
      document.getElementById("logoInput");

    const file = logoInput.files[0];

    if (!file) {
      return;
    }

    // Check file type
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {

      showMessage(
        "Please select a PNG, JPG or WEBP image.",
        "error"
      );

      logoInput.value = "";
      return;
    }

    // Check file size - maximum 2MB
    if (file.size > 2 * 1024 * 1024) {

      showMessage(
        "Logo must be smaller than 2MB.",
        "error"
      );

      logoInput.value = "";
      return;
    }

    showMessage(
      "Uploading logo...",
      "success"
    );

    // Create unique file name
    const fileExtension =
      file.name.split(".").pop();

    const fileName =
      `${user.id}-${Date.now()}.${fileExtension}`;

    const filePath =
      `${user.id}/${fileName}`;

    // Upload to Supabase Storage
    const {
      error: uploadError
    } = await supabaseClient
      .storage
      .from("business-logos")
      .upload(
        filePath,
        file,
        {
          cacheControl: "3600",
          upsert: false
        }
      );

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const {
      data: publicUrlData
    } = supabaseClient
      .storage
      .from("business-logos")
      .getPublicUrl(filePath);

    const logoUrl =
      publicUrlData.publicUrl;

    // Save logo URL to business profile
    const {
      error: updateError
    } = await supabaseClient
      .from("businesses")
      .update({
        logo_url: logoUrl
      })
      .eq(
        "user_id",
        user.id
      );

    if (updateError) {
      throw updateError;
    }

    // Show logo immediately
    const logoPreview =
      document.getElementById("logoPreview");

    logoPreview.innerHTML = `
      <img
        src="${logoUrl}"
        alt="Business Logo">
    `;

    showMessage(
      "Logo uploaded successfully!",
      "success"
    );

    logoInput.value = "";

  } catch (error) {

    console.error(
      "Logo upload error:",
      error
    );

    showMessage(
      "Unable to upload logo: " +
      error.message,
      "error"
    );

  }

}


// ======================================
// LOGO BUTTON
// ======================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    const uploadLogoBtn =
      document.getElementById(
        "uploadLogoBtn"
      );

    const logoInput =
      document.getElementById(
        "logoInput"
      );

    if (uploadLogoBtn && logoInput) {

      uploadLogoBtn.addEventListener(
        "click",
        function() {
          logoInput.click();
        }
      );

      logoInput.addEventListener(
        "change",
        uploadLogo
      );

    }

  }
);
function openSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (sidebar) {
    sidebar.classList.add("open");
  }

  if (overlay) {
    overlay.classList.add("show");
  }
}


function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (sidebar) {
    sidebar.classList.remove("open");
  }

  if (overlay) {
    overlay.classList.remove("show");
  }
}


function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");

  if (!sidebar) {
    return;
  }

  if (sidebar.classList.contains("open")) {
    closeSidebar();
  } else {
    openSidebar();
  }
}


document.addEventListener("keydown", function(event) {

  if (event.key === "Escape") {
    closeSidebar();
  }

});


document.addEventListener("DOMContentLoaded", function() {

  const logoutButton =
    document.getElementById("sidebarLogoutBtn");

  if (!logoutButton) {
    return;
  }

  logoutButton.addEventListener("click", async function() {

    const { error } =
      await supabaseClient.auth.signOut();

    if (error) {

      console.error(error);

      alert("Unable to logout.");

      return;
    }

    window.location.href = "login.html";

  });

});
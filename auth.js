// ========================================
// SIGN UP
// ========================================

const signupForm =
  document.getElementById("signupForm");


if (signupForm) {

  signupForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();


      const fullName =
        document.getElementById("fullName").value.trim();


      const email =
        document.getElementById("email").value.trim();


      const password =
        document.getElementById("password").value;


      const confirmPassword =
        document.getElementById("confirmPassword").value;


      const message =
        document.getElementById("message");


      const button =
        document.getElementById("signupButton");


      // Check passwords

      if (password !== confirmPassword) {

        showMessage(
          message,
          "Passwords do not match.",
          "error"
        );

        return;

      }


      if (password.length < 6) {

        showMessage(
          message,
          "Password must be at least 6 characters.",
          "error"
        );

        return;

      }


      button.disabled = true;

      button.textContent =
        "Creating account...";


      try {

        const { data, error } =
          await supabaseClient.auth.signUp({

            email: email,

            password: password,

            options: {

              data: {
                full_name: fullName
              },

              emailRedirectTo:
                window.location.origin +
                "/login.html"

            }

          });


        if (error) {

          throw error;

        }


        if (data.user && !data.session) {

          showMessage(
            message,
            "Account created! Please check your email and click the confirmation link before logging in.",
            "success"
          );

        } else {

          showMessage(
            message,
            "Account created successfully! Redirecting...",
            "success"
          );


          setTimeout(() => {

            window.location.href =
              "index.html";

          }, 1500);

        }

      } catch (error) {

        console.error(error);

        showMessage(
          message,
          error.message ||
          "Unable to create account.",
          "error"
        );

      } finally {

        button.disabled = false;

        button.textContent =
          "Create Account";

      }

    }
  );

}


// ========================================
// LOGIN
// ========================================

const loginForm =
  document.getElementById("loginForm");


if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();


      const email =
        document.getElementById("loginEmail").value.trim();


      const password =
        document.getElementById("loginPassword").value;


      const message =
        document.getElementById("loginMessage");


      const button =
        document.getElementById("loginButton");


      button.disabled = true;

      button.textContent =
        "Logging in...";


      try {

        const { data, error } =
          await supabaseClient.auth.signInWithPassword({

            email: email,

            password: password

          });


        if (error) {

          throw error;

        }


        showMessage(
          message,
          "Login successful! Redirecting...",
          "success"
        );


        setTimeout(() => {

          window.location.href =
            "dashboard.html";

        }, 1000);


      } catch (error) {

        console.error(error);

        showMessage(
          message,
          error.message ||
          "Invalid email or password.",
          "error"
        );

      } finally {

        button.disabled = false;

        button.textContent =
          "Login";

      }

    }
  );

}


// ========================================
// FORGOT PASSWORD
// ========================================

const forgotPassword =
  document.getElementById("forgotPassword");


if (forgotPassword) {

  forgotPassword.addEventListener(
    "click",
    async function (event) {

      event.preventDefault();


      const email =
        document.getElementById("loginEmail").value.trim();


      const message =
        document.getElementById("loginMessage");


      if (!email) {

        showMessage(
          message,
          "Enter your email address first.",
          "error"
        );

        return;

      }


      try {

        const { error } =
          await supabaseClient.auth.resetPasswordForEmail(
            email,
            {
              redirectTo:
                window.location.origin +
                "/login.html"
            }
          );


        if (error) {

          throw error;

        }


        showMessage(
          message,
          "Password reset instructions have been sent to your email.",
          "success"
        );


      } catch (error) {

        console.error(error);

        showMessage(
          message,
          error.message ||
          "Unable to send password reset email.",
          "error"
        );

      }

    }
  );

}


// ========================================
// MESSAGE FUNCTION
// ========================================

function showMessage(
  element,
  text,
  type
) {

  if (!element) return;

  element.textContent = text;

  element.className =
    "message " + type;

}
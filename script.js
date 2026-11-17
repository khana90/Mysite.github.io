

 // <script type="module">
   import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
  
    const supabaseUrl = "https://gntornzuemirlaqkrmjn.supabase.co";
    const supabaseKey = "sb_publishable_7QQEbL5E_6hpHKfmRFpVsQ_joO-r7I9";
    const supabaseClient = createClient(supabaseUrl, supabaseKey);


const registerForm = document.getElementById("registerForm");
const signupMessage = document.getElementById("signupMessage");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

if (!registerForm || !signupMessage || !loginForm || !loginMessage) {
  throw new Error("A form or message element is missing. Check the HTML IDs.");
}

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault("kkk");
  signupMessage.textContent = "Creating account...";

  const { error } = await supabaseClient.auth.signUp({
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value,
    options: {
      data: { name: document.getElementById("name").value.trim() }
    }
  });

  if (error) {
    console.error("Sign-up failed:", error.message);
    signupMessage.textContent = error.message;
    return;
  }

  signupMessage.textContent =
    "Sign-up succeeded. Check your email if confirmation is required.";
});


//                         <!-- Login form -->
// <script type="module">
//    import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
  
//     const supabaseUrl = "https://gntornzuemirlaqkrmjn.supabase.co";
//     const supabaseKey = "sb_publishable_7QQEbL5E_6hpHKfmRFpVsQ_joO-r7I9";
//     const supabaseClient = createClient(supabaseUrl, supabaseKey);

// const loginForm = document.getElementById("loginForm");
// const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "Signing in...";

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: document.getElementById("loginEmail").value.trim(),
    password: document.getElementById("loginPassword").value
  });

  if (error) {
    console.error("Login failed:", error.message);
    loginMessage.textContent = error.message;
    return;
  }

  loginMessage.textContent = `Signed in as ${data.user.email}.`;
  window.location.href = "index.html";
});




// Quote form submission
document.getElementById("quoteForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = document.getElementById("quoteMessage");
  message.textContent = "Submitting...";

  const quote = {
    id: crypto.randomUUID(),
    email: document.getElementById("quoteEmail").value.trim(),
    quantity: Number(document.getElementById("quantity").value),
    print_sides: document.getElementById("printSides").value,
    colored_edge: document.getElementById("coloredEdge").value === "yes",
    orientation: document.getElementById("orientation").value,
    product_size: document.getElementById("productSize").value
  };

  const { error } = await supabaseClient
    .from("quote_requests")
    .insert(quote);

  if (error) {
    console.error("Quote submission failed:", error);
    message.textContent = "Could not submit: " + error.message;
    return;
  }

  localStorage.setItem("quoteCheckout", JSON.stringify(quote));
  window.location.href = "checkout.html";
});

//checkout page script

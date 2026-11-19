
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseClient = createClient(
  "https://gntornzuemirlaqkrmjn.supabase.co",
  "sb_publishable_7QQEbL5E_6hpHKfmRFpVsQ_joO-r7I9"
);

const registerForm = document.getElementById("registerForm");

if (registerForm) {
  const signupMessage = document.getElementById("signupMessage");

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (signupMessage) signupMessage.textContent = "Creating account...";

    const { error } = await supabaseClient.auth.signUp({
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
      options: {
        data: { name: document.getElementById("name").value.trim() }
      }
    });

    if (error) {
      console.error("Sign-up failed:", error.message);
      if (signupMessage) signupMessage.textContent = error.message;
      return;
    }

    if (signupMessage) {
      signupMessage.textContent =
        "Sign-up succeeded. Confirm your email address.";
    }
  });
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  const loginMessage = document.getElementById("loginMessage");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (loginMessage) loginMessage.textContent = "Signing in...";

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: document.getElementById("loginEmail").value.trim(),
      password: document.getElementById("loginPassword").value
    });

    if (error) {
      console.error("Login failed:", error.message);
      if (loginMessage) loginMessage.textContent = error.message;
      return;
    }

    window.location.href = "index.html";
  });
}





// Quote form submission- flyer
const quoteForm = document.getElementById("quoteForm");
const quoteMessage = document.getElementById("quoteMessage");
const checkoutButton = document.getElementById("checkoutButton");
const submitButton = document.getElementById("quoteSubmitButton");

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP"
});

const prices = new Map();
let quoteSaved = false;

function showPrice(id, amount) {
  document.getElementById(id).textContent =
    amount == null ? "—" : currency.format(amount);
}

function updateQuoteSummary() {
  const values = {
    summaryEmail: document.getElementById("quoteEmail").value.trim(),
    summaryQuantity: document.getElementById("quantity").selectedOptions[0].textContent,
    summaryPrint: document.getElementById("printSides").selectedOptions[0].textContent,
    summaryEdge: document.getElementById("coloredEdge").selectedOptions[0].textContent,
    summaryOrientation: document.getElementById("orientation").selectedOptions[0].textContent,
    summarySize: document.getElementById("productSize").selectedOptions[0].textContent
  };

  for (const [id, value] of Object.entries(values)) {
    const fieldId = id === "summaryEmail" ? "quoteEmail" :
      id === "summaryQuantity" ? "quantity" :
      id === "summaryPrint" ? "printSides" :
      id === "summaryEdge" ? "coloredEdge" :
      id === "summaryOrientation" ? "orientation" : "productSize";

    document.getElementById(id).textContent =
      document.getElementById(fieldId).value ? value : "—";
  }

  const size = document.getElementById("productSize").value;
  const quantity = Number(document.getElementById("quantity").value);
  const price = prices.get(`${size}:${quantity}`);

  if (!price) {
    showPrice("summaryBasePrice", null);
    showPrice("summaryEdgePrice", null);
    showPrice("summaryShipping", null);
    showPrice("summaryTotal", null);
    return null;
  }

  const edgePrice =
    document.getElementById("coloredEdge").value === "yes"
      ? price.edgeSurcharge
      : 0;

  const total = price.base + edgePrice + price.shipping;

  showPrice("summaryBasePrice", price.base);
  showPrice("summaryEdgePrice", edgePrice);
  showPrice("summaryShipping", price.shipping);
  showPrice("summaryTotal", total);

  return { base: price.base, edge: edgePrice, shipping: price.shipping, total };
}

function invalidateSavedQuote() {
  updateQuoteSummary();

  if (quoteSaved) {
    quoteSaved = false;
    checkoutButton.disabled = true;
    sessionStorage.removeItem("quoteCheckout");
    quoteMessage.textContent = "Selections changed. Submit the quote again before checkout.";
  }
}

async function loadPrices() {
  submitButton.disabled = true;
  checkoutButton.disabled = true;

  const { data, error } = await supabaseClient
    .from("quote_prices")
    .select("product_size, quantity, base_price, edge_surcharge, shipping");

  if (error) {
    console.error("Could not load quote prices:", error);
    quoteMessage.textContent = "Could not load prices. Please refresh and try again.";
    return;
  }

  for (const row of data) {
    prices.set(`${row.product_size}:${row.quantity}`, {
      base: Number(row.base_price),
      edgeSurcharge: Number(row.edge_surcharge),
      shipping: Number(row.shipping)
    });
  }

  submitButton.disabled = false;
  updateQuoteSummary();
}

quoteForm.addEventListener("input", invalidateSavedQuote);
quoteForm.addEventListener("change", invalidateSavedQuote);

quoteForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const quote = {
    id: crypto.randomUUID(),
    email: document.getElementById("quoteEmail").value.trim(),
    quantity: Number(document.getElementById("quantity").value),
    print_sides: document.getElementById("printSides").value,
    colored_edge: document.getElementById("coloredEdge").value === "yes",
    orientation: document.getElementById("orientation").value,
    product_size: document.getElementById("productSize").value
  };

  submitButton.disabled = true;
  quoteMessage.textContent = "Saving your quote...";

  try {
    const { error } = await supabaseClient
      .from("quote_requests")
      .insert(quote);

    if (error) {
      console.error("Quote save failed:", error);
      quoteMessage.textContent = `Could not save quote: ${error.message}`;
      return;
    }

    sessionStorage.setItem("quoteCheckout", JSON.stringify(quote));
    quoteSaved = true;
    checkoutButton.disabled = false;
    quoteMessage.textContent = "Quote saved. You can continue to checkout.";
  } catch (error) {
    console.error("Quote request failed:", error);
    quoteMessage.textContent = "Could not reach the server. Please try again.";
  } finally {
    submitButton.disabled = false;
  }
});

checkoutButton.addEventListener("click", () => {
  if (quoteSaved) window.location.href = "checkout.html";
});

loadPrices();




//checkout page script

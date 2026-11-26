
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseClient = createClient(
  "https://gntornzuemirlaqkrmjn.supabase.co",
  "sb_publishable_7QQEbL5E_6hpHKfmRFpVsQ_joO-r7I9"
);
// At the top of script.js shows error
console.log("script.js loaded", location.pathname);

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

  console.log("Looking up price:", {
    size,
    quantity,
    keys: [...prices.keys()]
  });
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


// Load prices from Supabase
async function loadPrices() {
  console.log("loadPrices called");

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
  prices.clear();

  console.log("Price rows from Supabase:", data); // Log the data received from Supabase

  for (const row of data) {
    prices.set(`${String(row.product_size).trim().toUpperCase()}:${Number(row.quantity)}`, {
      base: Number(row.base_price),
      edgeSurcharge: Number(row.edge_surcharge),
      shipping: Number(row.shipping)
    });
  }
  console.log("Loaded prices keys:", [...prices.keys()]);

  submitButton.disabled = false;
  updateQuoteSummary();
}




// Invalidate saved quote if any selection changes
function invalidateSavedQuote() {
  updateQuoteSummary();

  if (quoteSaved) {
    quoteSaved = false;
    checkoutButton.disabled = true;
    sessionStorage.removeItem("quoteCheckout");
    quoteMessage.textContent = "Selections changed. Submit the quote again before checkout.";
  }
}


if (quoteForm) {
  quoteForm.addEventListener("input", invalidateSavedQuote);
  quoteForm.addEventListener("change", invalidateSavedQuote);

  quoteForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const pricing = updateQuoteSummary();
    if (!pricing) {
      quoteMessage.textContent = "Select a product size and quantity first.";
      return;
    }



    submitButton.disabled = true;
    quoteMessage.textContent = "Checking sign-in...";

    try {
      const { data: { user }, error: authError } =
        await supabaseClient.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        quoteMessage.textContent =
          "Please sign in or register before submitting your quote.";
        return;
      }

      const quote = {
        id: crypto.randomUUID(),
        user_id: user.id,
        email: user.email,
        quantity: Number(document.getElementById("quantity").value),
        print_sides: document.getElementById("printSides").value,
        colored_edge: document.getElementById("coloredEdge").value === "yes",
        orientation: document.getElementById("orientation").value,
        product_size: document.getElementById("productSize").value
      };

      quoteMessage.textContent = "Adding quote to your basket...";

      const { data, error } = await supabaseClient
        .from("quote_requests")
        .insert(quote)
        .select("id")
        .single();

      if (error) throw error;

      sessionStorage.setItem("quoteCheckout", JSON.stringify({
        ...quote,
        quote_request_id: data.id,
        base_price_gbp: pricing.base,
        edge_surcharge_gbp: pricing.edge,
        shipping_gbp: pricing.shipping,
        total_price_gbp: pricing.total
      }));

      quoteSaved = true;
      checkoutButton.disabled = false;
      quoteMessage.textContent = "Quote added to your basket.";
      await updateBasketCount();
    } catch (error) {
      console.error("Could not save quote:", error);
      quoteMessage.textContent = `Could not save quote: ${error.message}`;
    } finally {
      submitButton.disabled = false;
    }
  });

    checkoutButton.addEventListener("click", () => {
    if (quoteSaved) window.location.href = "basket.html";
      });

  loadPrices();
}
//basket

async function updateBasketCount() {
  const badge = document.getElementById("basketCount");
  if (!badge) return;

  const { data: { user }, error: authError } =
    await supabaseClient.auth.getUser();

  if (authError) {
    console.error("Could not check signed-in user:", authError);
    return;
  }

  if (!user) {
    badge.textContent = "0";
    return;
  }

  const { count, error } = await supabaseClient
    .from("quote_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "basket");

  if (error) {
    console.error("Could not load basket count:", error);
    return;
  }

  badge.textContent = String(count ?? 0);
}

updateBasketCount();


// basket js
async function loadBasket() {
  const tbody = document.getElementById("basketItems");
  if (!tbody) return;

  const message = document.getElementById("basketMessage");
  const checkoutLink = document.getElementById("checkoutLink");
  const grandTotalCell = document.getElementById("basketGrandTotal");
  const money = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP"
  });

  checkoutLink.classList.add("disabled");
  checkoutLink.setAttribute("aria-disabled", "true");
  grandTotalCell.textContent = money.format(0);
  message.textContent = "Loading your basket...";


  try {
    const { data: { user }, error: authError } =
      await supabaseClient.auth.getUser();

    if (authError) throw authError;

    if (!user) {
      message.textContent = "Sign in to see your basket.";
      return;
    }

    const { data: quotes, error } = await supabaseClient
      .from("quote_requests")
      .select("id, quantity, print_sides, colored_edge, orientation, product_size, total_price_gbp")
      .eq("user_id", user.id)
      .eq("status", "basket")
      .order("created_at", { ascending: false });

    if (error) throw error;

    tbody.replaceChildren();

    if (!quotes.length) {
      message.textContent = "Your basket is empty. Add a quote to get started.";
      return;
    }

    let total = 0;

    for (const quote of quotes) {
      const row = document.createElement("tr");
      const price = Number(quote.total_price_gbp) || 0;
      total += price;

      const values = [
        quote.quantity,
        quote.print_sides === "both_sides" ? "Both sides" : "Front only",
        quote.colored_edge ? "Yes" : "No",
        quote.orientation,
        quote.product_size,
        money.format(price)
      ];

      for (const value of values) {
        const cell = document.createElement("td");
        cell.textContent = String(value);
        row.appendChild(cell);
      }

      const actionCell = document.createElement("td");
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "btn btn-sm btn-outline-danger";
      removeButton.textContent = "Remove";

      removeButton.addEventListener("click", async () => {
        removeButton.disabled = true;

        const { error: deleteError } = await supabaseClient
          .from("quote_requests")
          .delete()
          .eq("id", quote.id)
          .eq("user_id", user.id);

        if (deleteError) {
          console.error("Could not remove quote:", deleteError);
          message.textContent = `Could not remove item: ${deleteError.message}`;
          removeButton.disabled = false;
          return;
        }

        await loadBasket();
        await updateBasketCount();
      });

      actionCell.appendChild(removeButton);
      row.appendChild(actionCell);
      tbody.appendChild(row);
    }

    grandTotalCell.textContent = money.format(total);
    message.textContent = `${quotes.length} item${quotes.length === 1 ? "" : "s"} in your basket.`;
    checkoutLink.classList.remove("disabled");
    checkoutLink.setAttribute("aria-disabled", "false");
  } catch (error) {
    console.error("Could not load basket:", error);
    message.textContent = "Could not load your basket. Check the Console for details.";
  }
}

loadBasket();
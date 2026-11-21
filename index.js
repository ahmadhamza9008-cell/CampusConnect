
// ======================================
// 1. SUPABASE CONNECTION
// ======================================

const SUPABASE_URL = "https://rntlrtuufsvtxrvbrghf.supabase.co";

const SUPABASE_KEY = "sb_publishable_CKD8Mq88x4wrgaCLaw3zfg_sZG4n-Sa";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ======================================
// 2. HTML ELEMENTS
// ======================================

const searchInput = document.querySelector("#search");
const categorySelect = document.querySelector("#category");
const opportunitiesList = document.querySelector("#opportunity-list");
const resultCount = document.querySelector("#result-count");

const opportunityForm = document.querySelector("#opportunity-form");
const formMessage = document.querySelector("#form-message");
const deadlineInput = document.querySelector("#deadline");

// Opportunities will now come from Supabase.
let opportunities = [];

// ======================================
// 3. GET TODAY'S DATE
// ======================================

function getToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

if (deadlineInput) {
    deadlineInput.min = getToday();
}

// ======================================
// 4. DISPLAY OPPORTUNITIES
// ======================================

function displayOpportunities() {

    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categorySelect.value;

    const filtered = opportunities.filter(function(item) {

        const title = String(item.title || "");
        const description = String(item.description || "");
        const matchesSearch =
            title.toLowerCase().includes(searchTerm) ||
            description.toLowerCase().includes(searchTerm);

        const matchesCategory =
            selectedCategory === "" ||
            selectedCategory === "All" ||
            item.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    if (filtered.length === 0) {
        opportunitiesList.textContent = "No opportunities match your search.";
    } else {
        opportunitiesList.replaceChildren();
    }

    filtered.forEach(function(item) {

        const card = document.createElement("div");
        card.className = "opportunity-card";
        const normalizedTitle = String(item.title || "Untitled opportunity");
        const normalizedDescription = String(item.description || "");

        const category = document.createElement("p");
        category.className = "category";
        category.textContent = String(item.category || "Other");

        const cardTitle = document.createElement("h2");
        cardTitle.textContent = normalizedTitle;

        const description = document.createElement("p");
        description.textContent = normalizedDescription;

        const deadline = document.createElement("p");
        deadline.className = "deadline";
        deadline.textContent = item.deadline
            ? `Deadline: ${item.deadline}`
            : "Deadline not specified";

        const button = document.createElement("a");
        button.className = "card-button";
        button.textContent = "View opportunity";
        button.href = item.url || "#";

        if (item.url) {
            button.target = "_blank";
            button.rel = "noopener noreferrer";
        }

        card.append(category, cardTitle, description, deadline, button);

        opportunitiesList.appendChild(card);
    });

    resultCount.textContent =
        `${filtered.length} opportunity(ies) found.`;
}

// ======================================
// 5. LOAD OPPORTUNITIES FROM SUPABASE
// ======================================

async function loadOpportunities() {

    opportunitiesList.textContent = "Loading opportunities...";

   const { data, error } = await supabaseClient
    .from("opportunities")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

    if (error) {
        console.error("Error loading opportunities:", error.message);

        opportunitiesList.textContent =
            "Could not load opportunities. Please refresh the page.";

        return;
    }

    opportunities = data || [];

    console.log("Opportunities loaded from Supabase:", opportunities.length);

    displayOpportunities();
}

// ======================================
// 6. SEARCH AND CATEGORY FILTERS
// ======================================

searchInput.addEventListener("input", displayOpportunities);

categorySelect.addEventListener("change", displayOpportunities);

// ======================================
// 7. HANDLE FORM SUBMISSION
// ======================================

opportunityForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const title = document.querySelector("#title").value.trim();

    const category = document.querySelector("#new-category").value;
    const validCategories = ["Scholarship", "Internship", "Event", "Training"];
    if (!validCategories.includes(category)) {
        showError("Please select a valid category.");
        return;
    }

    const description =
        document.querySelector("#description").value.trim();

    const deadline = deadlineInput.value;

    const url = document.querySelector("#url").value.trim();

    formMessage.textContent = "";
    formMessage.className = "";

    // Check title
    if (title.length < 5) {
        showError("The title must contain at least 5 characters.");
        return;
    }

    // Check description
    if (description.length < 20) {
        showError("Please write a description of at least 20 characters.");
        return;
    }

    // Check deadline
    if (!deadline || deadline < getToday()) {
        showError("Please select today or a future deadline.");
        return;
    }

    // Check website link
    let validUrl;

    try {
        validUrl = new URL(url);
    } catch {
        showError("Please enter a valid website link.");
        return;
    }

    if (!["https:", "http:"].includes(validUrl.protocol)) {
        showError("The link must start with https:// or http://.");
        return;
    }

    // Prepare the new opportunity
    const newOpportunity = {
        title: title,
        category: category,
        description: description,
        deadline: deadline,
        url: validUrl.href,
        status: "pending"
    };

    formMessage.textContent = "Saving opportunity...";
    const submitButton = opportunityForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    // Save directly to Supabase
    const { error } = await supabaseClient
        .from("opportunities")
        .insert(newOpportunity);

    if (error) {
        console.error("Submission error:", error.message);

        showError("Could not save opportunity. Please try again.");
        submitButton.disabled = false;
        return;
    }

    formMessage.textContent =
        "Opportunity submitted successfully and is awaiting approval.";

    formMessage.className = "success";

    opportunityForm.reset();
    submitButton.disabled = false;

    if (deadlineInput) {
        deadlineInput.min = getToday();
    }
});

// ======================================
// 8. DISPLAY ERROR MESSAGES
// ======================================

function showError(message) {

    formMessage.textContent = message;
    formMessage.className = "error";
}

// ======================================
// 9. START CAMPUSCONNECT
// ======================================

loadOpportunities();

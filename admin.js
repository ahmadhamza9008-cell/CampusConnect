
// ======================================
// 1. SUPABASE CONNECTION
// ======================================

const SUPABASE_URL = "https://rntlrtuufsvtxrvbrghf.supabase.co";

const SUPABASE_KEY = "sb_publishable_CKD8Mq88x4wrgaCLaw3zfg_sZG4n-Sa";

const ADMIN_USER_ID = "d1cece27-f205-461d-bce7-ec9ceaf0a2c0";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ======================================
// 2. HTML ELEMENTS
// ======================================

const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");
const loginSection = document.querySelector("#login-section");

const dashboard = document.querySelector("#admin-dashboard");
const adminWelcome = document.querySelector("#admin-welcome");
const dashboardMessage = document.querySelector("#dashboard-message");

const opportunityList = document.querySelector("#admin-opportunity-list");
const adminListMessage = document.querySelector("#admin-list-message");
const addForm = document.querySelector("#add-form");
const addMessage = document.querySelector("#add-message");
const addDeadline = document.querySelector("#add-deadline");

const statusFilter = document.querySelector("#status-filter");

const adminSearch = document.querySelector("#admin-search");

// DASHBOARD SUMMARY ELEMENTS
const totalCount = document.querySelector("#total-count");
const pendingCount = document.querySelector("#pending-count");
const approvedCount = document.querySelector("#approved-count");
const rejectedCount = document.querySelector("#rejected-count");

const editForm = document.querySelector("#edit-form");
const editTitle = document.querySelector("#edit-title");
const editCategory = document.querySelector("#edit-category");
const editDescription = document.querySelector("#edit-description");
const editDeadline = document.querySelector("#edit-deadline");
const editUrl = document.querySelector("#edit-url");
const editMessage = document.querySelector("#edit-message");
const cancelEdit = document.querySelector("#cancel-edit");

let editingOpportunityId = null;

const logoutButton = document.querySelector("#logout-button");

function getToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getOpportunityUrl(value, required) {
    const trimmedUrl = value.trim();
    if (!trimmedUrl && !required) {
        return { url: null };
    }

    try {
        const url = new URL(trimmedUrl);
        if (!["https:", "http:"].includes(url.protocol)) {
            throw new Error("Invalid protocol");
        }
        return { url: url.href };
    } catch {
        return { error: "Please enter a valid http:// or https:// link." };
    }
}

function showAdminListMessage(message, type = "") {
    adminListMessage.textContent = message;
    adminListMessage.className = type;
}

// ======================================
// 3. ADMIN LOGIN
// ======================================

loginForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value;

    loginMessage.textContent = "Signing in...";
    loginMessage.className = "";

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        loginMessage.textContent = error.message;
        loginMessage.className = "error";
        return;
    }

    await checkAdmin(data.user);
});

// ======================================
// 4. CHECK ADMIN IDENTITY
// ======================================

async function checkAdmin(user) {

    if (!user || user.id !== ADMIN_USER_ID) {

        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error("Could not sign out non-admin user:", error.message);
        }

        loginMessage.textContent =
            "Access denied. This account is not an administrator.";
        loginMessage.className = "error";

        return;
    }

    loginMessage.textContent = "";
    loginMessage.className = "";
    loginSection.hidden = true;
    dashboard.hidden = false;

    adminWelcome.textContent = `Welcome, ${user.email || "Administrator"}`;
    addDeadline.min = getToday();
    editDeadline.min = getToday();

    await loadAdminOpportunities();
    await updateDashboardCounts();
}

// ======================================
// 5. LOAD OPPORTUNITIES
// ======================================


async function loadAdminOpportunities() {
    showAdminListMessage("Loading opportunities...");
    opportunityList.replaceChildren();

    const { data, error } = await supabaseClient
        .from("opportunities")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Could not load opportunities:", error.message);
        showAdminListMessage(
            "Could not load opportunities. Please try again.",
            "error"
        );
        return;
    }

    if (!data || data.length === 0) {
        showAdminListMessage("No opportunities found.");
        return;
    }

    showAdminListMessage("");
    let visibleCount = 0;

    data.forEach(function(item) {

        // FILTER BY STATUS
        if (
            statusFilter.value !== "all" &&
            item.status !== statusFilter.value
        ) {
            return;
        }

        // SEARCH BY TITLE OR CATEGORY
        const searchText = adminSearch.value.toLowerCase().trim();

        const matchesSearch =
            String(item.title || "").toLowerCase().includes(searchText) ||
            String(item.category || "").toLowerCase().includes(searchText);

        if (!matchesSearch) {
            return;
        }

        const card = document.createElement("div");
        card.className = "opportunity-card";

        const title = document.createElement("h3");
        title.textContent = item.title;

        const category = document.createElement("p");
        category.textContent = "Category: " + item.category;

        const description = document.createElement("p");
        description.textContent = item.description;

        const deadline = document.createElement("p");
        deadline.textContent = "Deadline: " + item.deadline;

        // EDIT BUTTON
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function() {
            editingOpportunityId = item.id;

            editTitle.value = item.title;
            editCategory.value = item.category;
            editDescription.value = item.description;
            editDeadline.value = item.deadline;
            editDeadline.min = getToday();
            editUrl.value = item.url || "";

            editMessage.textContent = "";
            editMessage.className = "";
            editForm.hidden = false;

            editForm.scrollIntoView({ behavior: "smooth" });
        });

        // DELETE BUTTON
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "danger-button";

        deleteButton.addEventListener("click", async function() {
            const confirmDelete = window.confirm(
                "Are you sure you want to delete this opportunity?"
            );

            if (!confirmDelete) {
                return;
            }

            const { error } = await supabaseClient
                .from("opportunities")
                .delete()
                .eq("id", item.id);

            if (error) {
                console.error("Could not delete opportunity:", error.message);
                showAdminListMessage(
                    "Could not delete opportunity. Please try again.",
                    "error"
                );
                return;
            }

            await loadAdminOpportunities();
            await updateDashboardCounts();
            showAdminListMessage("Opportunity deleted successfully.", "success");
        });

    // APPROVE BUTTON
    const approveButton = document.createElement("button");
    approveButton.type = "button";
    approveButton.textContent = "Approve";
    approveButton.className = "approve-button";

    approveButton.addEventListener("click", async function() {
        const { error } = await supabaseClient
            .from("opportunities")
            .update({ status: "approved" })
            .eq("id", item.id);

    if (error) {
        console.error("Approval failed:", error.message);
        showAdminListMessage("Could not approve opportunity. Please try again.", "error");
        return;
    }

    await loadAdminOpportunities();
    await updateDashboardCounts();
    showAdminListMessage("Opportunity approved successfully.", "success");
});

        // REJECT BUTTON
        const rejectButton = document.createElement("button");
        rejectButton.type = "button";
        rejectButton.textContent = "Reject";
        rejectButton.className = "reject-button";

        rejectButton.addEventListener("click", async function() {
            const confirmReject = window.confirm(
                "Are you sure you want to reject this opportunity?"
            );

            if (!confirmReject) return;

            const { error } = await supabaseClient
                .from("opportunities")
                .update({ status: "rejected" })
                .eq("id", item.id);

            if (error) {
                console.error("Rejection failed:", error.message);
                showAdminListMessage(
                    "Could not reject opportunity. Please try again.",
                    "error"
                );
                return;
            }

            await loadAdminOpportunities();
            await updateDashboardCounts();
            showAdminListMessage("Opportunity rejected.", "success");
});

        // DISPLAY OPPORTUNITY DETAILS
        const status = document.createElement("p");
        status.textContent = "Status: " + item.status;

        card.append(
            title,
            category,
            description,
            deadline,
            status
        );

        // Show approval buttons only for pending opportunities
        if (item.status === "pending") {
            card.append(approveButton, rejectButton);
        }

        // Always show Edit and Delete buttons
        card.append(editButton, deleteButton);

        opportunityList.appendChild(card);
        visibleCount++;
    });

    if (visibleCount === 0) {
        showAdminListMessage("No opportunities match your filters.");
    }
}

// UPDATE DASHBOARD SUMMARY
async function updateDashboardCounts() {
    dashboardMessage.textContent = "Loading dashboard summary...";
    dashboardMessage.className = "";
    totalCount.textContent = "Loading...";
    pendingCount.textContent = "Loading...";
    approvedCount.textContent = "Loading...";
    rejectedCount.textContent = "Loading...";

    const { data, error } = await supabaseClient
        .from("opportunities")
        .select("status");

    if (error || !data) {
        console.error(
            "Could not load dashboard counts:",
            error ? error.message : "No data returned."
        );
        totalCount.textContent = "Unavailable";
        pendingCount.textContent = "Unavailable";
        approvedCount.textContent = "Unavailable";
        rejectedCount.textContent = "Unavailable";
        dashboardMessage.textContent =
            "Could not load dashboard counts. Please refresh the page.";
        dashboardMessage.className = "error";
        return;
    }

    const total = data.length;
    const pending = data.filter(item => item.status === "pending").length;
    const approved = data.filter(item => item.status === "approved").length;
    const rejected = data.filter(item => item.status === "rejected").length;

    totalCount.textContent = total;
    pendingCount.textContent = pending;
    approvedCount.textContent = approved;
    rejectedCount.textContent = rejected;
    dashboardMessage.textContent = "";
    dashboardMessage.className = "";
}

// ======================================
// 6. ADMIN LOGOUT
// ======================================

logoutButton.addEventListener("click", async function() {

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error("Logout error:", error.message);
        dashboardMessage.textContent = "Could not log out. Please try again.";
        dashboardMessage.className = "error";
        return;
    }

    dashboard.hidden = true;
    loginSection.hidden = false;

    loginForm.reset();

    loginMessage.textContent = "You have logged out successfully.";
    loginMessage.className = "success";
});

// ======================================
// 7. CHECK EXISTING LOGIN
// ======================================

async function checkExistingLogin() {

    const { data, error } = await supabaseClient.auth.getUser();

    if (error && error.name !== "AuthSessionMissingError" &&
        error.message !== "Auth session missing!") {
        console.error("Could not check existing admin session:", error.message);
        loginMessage.textContent =
            "Could not verify your session. Please sign in again.";
        loginMessage.className = "error";
        return;
    }

    if (error || !data.user) {
        return;
    }

    await checkAdmin(data.user);
}

checkExistingLogin();

addForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const title = document.querySelector("#add-title").value.trim();
    const category = document.querySelector("#add-category").value;
    const description = document.querySelector("#add-description").value.trim();
    const deadline = addDeadline.value;
    const parsedUrl = getOpportunityUrl(
        document.querySelector("#add-url").value,
        true
    );
    const status = document.querySelector("#add-status").value;
    const validCategories = ["Scholarship", "Internship", "Event", "Training"];

    addMessage.textContent = "";
    addMessage.className = "";

    if (title.length < 5 || title.length > 100) {
        addMessage.textContent = "The title must be between 5 and 100 characters.";
        addMessage.className = "error";
        return;
    }

    if (!validCategories.includes(category)) {
        addMessage.textContent = "Please select a valid category.";
        addMessage.className = "error";
        return;
    }

    if (description.length < 20 || description.length > 500) {
        addMessage.textContent =
            "The description must be between 20 and 500 characters.";
        addMessage.className = "error";
        return;
    }

    if (!deadline || deadline < getToday()) {
        addMessage.textContent = "Please select today or a future deadline.";
        addMessage.className = "error";
        return;
    }

    if (parsedUrl.error) {
        addMessage.textContent = parsedUrl.error;
        addMessage.className = "error";
        return;
    }

    if (!["approved", "pending"].includes(status)) {
        addMessage.textContent = "Please select a valid initial status.";
        addMessage.className = "error";
        return;
    }

    const submitButton = addForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    addMessage.textContent = "Adding opportunity...";

    const { error } = await supabaseClient
        .from("opportunities")
        .insert({
            title,
            category,
            description,
            deadline,
            url: parsedUrl.url,
            status
        });

    submitButton.disabled = false;

    if (error) {
        console.error("Could not add opportunity:", error.message);
        addMessage.textContent =
            "Could not add opportunity. Please check your access and try again.";
        addMessage.className = "error";
        return;
    }

    addForm.reset();
    addDeadline.min = getToday();
    addMessage.textContent = "Opportunity added successfully.";
    addMessage.className = "success";
    await loadAdminOpportunities();
    await updateDashboardCounts();
});

// Save edited opportunity
editForm.addEventListener("submit", async function(event) {
    event.preventDefault();
    editMessage.className = "";

    if (!editingOpportunityId) {
        editMessage.textContent = "No opportunity selected.";
        editMessage.className = "error";
        return;
    }

    const title = editTitle.value.trim();
    const description = editDescription.value.trim();
    const parsedUrl = getOpportunityUrl(editUrl.value, false);

    if (title.length < 5 || title.length > 100) {
        editMessage.textContent = "The title must be between 5 and 100 characters.";
        editMessage.className = "error";
        return;
    }

    if (description.length < 20 || description.length > 500) {
        editMessage.textContent =
            "The description must be between 20 and 500 characters.";
        editMessage.className = "error";
        return;
    }

    if (!editDeadline.value || editDeadline.value < getToday()) {
        editMessage.textContent = "The deadline cannot be in the past.";
        editMessage.className = "error";
        return;
    }

    if (parsedUrl.error) {
        editMessage.textContent = parsedUrl.error;
        editMessage.className = "error";
        return;
    }

    const updatedOpportunity = {
        title,
        category: editCategory.value,
        description,
        deadline: editDeadline.value,
        url: parsedUrl.url
    };

    editMessage.textContent = "Saving changes...";
    editMessage.className = "";
    const submitButton = editForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    const { error } = await supabaseClient
        .from("opportunities")
        .update(updatedOpportunity)
        .eq("id", editingOpportunityId);

    submitButton.disabled = false;

    if (error) {
        console.error("Could not update opportunity:", error.message);
        editMessage.textContent =
            "Could not save changes. Please check your access and try again.";
        editMessage.className = "error";
        return;
    }

    editingOpportunityId = null;
    editForm.reset();
    editForm.hidden = true;

    await loadAdminOpportunities();
    await updateDashboardCounts();
    showAdminListMessage("Opportunity updated successfully.", "success");
});

// Cancel editing
cancelEdit.addEventListener("click", function() {
    editingOpportunityId = null;
    editForm.reset();
    editForm.hidden = true;
    editMessage.textContent = "";
    editMessage.className = "";
});

// STATUS FILTER
statusFilter.addEventListener("change", function() {
    loadAdminOpportunities();
});

// ADMIN SEARCH
adminSearch.addEventListener("input", function() {
    loadAdminOpportunities();
});
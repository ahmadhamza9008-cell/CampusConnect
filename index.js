const saveOpportunities = JSON.parse(localStorage.getItem("campusconnect-Opportunities")) || [];


const opportunities = [
    ...saveOpportunities,
    {
        title: "Web Developmeent Workshop",
        category: "Training",
        description: "A sample listing for beginnner web developers.",
        deadline: "30 November 2026",
    },
    {
        title: "Student Internship Programme",
        category: "Internship",
        description: "A sample listing for students seeking experience.",
        deadline: "15 December 2026",
    },
    {
        title: "Student Scholarship",
        category: "Scholarship",
        description: "A sample listing for technology events.",
        deadline: "31 January 2027",
    },
    {
        title: "Community Technology Meetup",
        category: "Event",
        description: "A sample listing for a tecchnologgy event.",
        deadline: "10 February 2027",
    }
];

const searchInput = document.querySelector("#search");
const categorySelect = document.querySelector("#category");
const opportunitiesList = document.querySelector("#Opportunities-list");
const resultCount = document.querySelector("#result-count");

function displayOpportunities() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categorySelect.value;

    const filtered = opportunities.filter(function(item) {
        const matchesSearch = 
    item.title.toLowerCase().includes(searchTerm) || 
    item.description.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === "" || item.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    opportunitiesList.replaceChildren();

    filtered.forEach(function(item) {
        const card = document.createElement("div");
        card.className += "opportunity-card";

        const category = document.createElement("p");
        category.className = "category";
        category.textContent = item.category;

        const title = document.createElement("h2");
        title.textContent = item.title;

        const description = document.createElement("p");
        description.textContent = item.description;

        const deadline = document.createElement("p");
        deadline.className = "deadline";
        deadline.textContent = item.deadline;

        const button = document.createElement("a");
        button.className = "card-button";
        button.textContent = "View opportunity";

        // Temporary demonstration link.
        // Replace "#" with a verified opportunity URL
        // when you have genuine listings.
        button.href = "#";

        card.append(category, title, description, deadline, button);
        opportunityList.appendChild(card);


        card.append(category, title, description, deadline);
        opportunitiesList.appendChild(card);
    });

    resultCount.textContent =
        `${filtered.length} opportunity(ies) found.`;
}

searchInput.addEventListener("input", displayOpportunities);
categorySelect.addEventListener("change", displayOpportunities);

displayOpportunities();


const opportunityForm = document.querySelector("#opportunity-form");
const formMessage = document.querySelector("#form-message");
const deadlineInput = document.querySelector("#deadline");

// Prevent users from selecting a past deadline.
function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

deadlineInput.min = getToday();

// Handle form submission.
opportunityForm.addEventListener("submit", function (event) {
  event.preventDefault();

  // Read the values entered by the user.
  const title = document.querySelector("#title").value.trim();
  const category = document.querySelector("#new-category").value;
  const description = document.querySelector("#description").value.trim();
  const deadline = deadlineInput.value;
  const url = document.querySelector("#url").value.trim();

  // Clear the previous message.
  formMessage.textContent = "";
  formMessage.className = "";

  // Check the title.
  if (title.length < 5) {
    showError("The title must contain at least 5 characters.");
    return;
  }

  // Check the description.
  if (description.length < 20) {
    showError("Please write a description of at least 20 characters.");
    return;
  }

  // Check the deadline.
  if (!deadline || deadline < getToday()) {
    showError("Please select today or a future deadline.");
    return;
  }

  // Check the official link.
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

  // Create the new opportunity.
  const newOpportunity = {
    title: title,
    category: category,
    description: description,
    deadline: deadline,
    url: validUrl.href
  };

  // Add it to the current list.
  opportunities.unshift(newOpportunity);

  localStorage.setItem("campusconnect-Opportunities", JSON.stringify(opportunities));

  // Refresh the visible cards.
  displayOpportunities();

  // Show a success message.
  formMessage.textContent =
    "Opportunity added successfully to this session!";
  formMessage.className = "success";

  // Clear the form.
  opportunityForm.reset();
  deadlineInput.min = getToday();
});

// Display an error message.
function showError(message) {
  formMessage.textContent = message;
  formMessage.className = "error";
}

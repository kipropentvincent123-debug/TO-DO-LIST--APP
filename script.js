
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const formMessage = document.getElementById("form-message");

const totalCount = document.getElementById("total-count");
const activeCount = document.getElementById("active-count");
const completedCount = document.getElementById("completed-count");

const progressBar = document.getElementById("progress-bar");
const progressPercent = document.getElementById("progress-percent");
const progressTrack = document.getElementById("progress-track");

const emptyState = document.getElementById("empty-state");
const emptyTitle = document.getElementById("empty-title");
const emptyMessage = document.getElementById("empty-message");
const clearCompletedBtn = document.getElementById("clear-completed");
const filterButtons = document.querySelectorAll(".filter-btn");

const STORAGE_KEY = "my-todo-list-tasks";

let tasks = loadTasks();
let currentFilter = "all";

function loadTasks() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.text === "string" &&
            typeof task.completed === "boolean"
        );
    } catch (error) {
        console.error("Could not load tasks:", error);
        return [];
    }
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error("Could not save tasks:", error);
        formMessage.textContent = "Could not save tasks in this browser.";
    }
}

function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return Date.now().toString(36) +
        Math.random().toString(36).slice(2);
}

// Add a new task
taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const text = taskInput.value.trim();

    if (!text) {
        formMessage.textContent = "Please enter a task first.";
        taskInput.focus();
        return;
    }

    if (text.length > 200) {
        formMessage.textContent = "Tasks must be 200 characters or fewer.";
        return;
    }

    tasks.unshift({
        id: createId(),
        text: text,
        completed: false
    });

    saveTasks();
    renderTasks();

    taskInput.value = "";
    formMessage.textContent = "Task added successfully!";
    taskInput.focus();
});

// Create task elements safely
function renderTasks() {
    taskList.replaceChildren();

    const visibleTasks = tasks.filter(task => {
        if (currentFilter === "active") {
            return !task.completed;
        }

        if (currentFilter === "completed") {
            return task.completed;
        }

        return true;
    });

    visibleTasks.forEach(task => {
        const item = document.createElement("li");
        item.className = "task-item";

        if (task.completed) {
            item.classList.add("completed");
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-check";
        checkbox.checked = task.completed;
        checkbox.setAttribute(
            "aria-label",
            `Mark ${task.text} as ${task.completed ? "active" : "completed"}`
        );

        checkbox.addEventListener("change", function () {
            task.completed = checkbox.checked;
            saveTasks();
            renderTasks();
        });

        const text = document.createElement("span");
        text.className = "task-text";
        text.textContent = task.text;

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "action-btn";
        editButton.textContent = "Edit";
        editButton.setAttribute("aria-label", `Edit ${task.text}`);

        editButton.addEventListener("click", function () {
            editTask(task.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "action-btn delete";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute("aria-label", `Delete ${task.text}`);

        deleteButton.addEventListener("click", function () {
            deleteTask(task.id);
        });

        actions.append(editButton, deleteButton);
        item.append(checkbox, text, actions);
        taskList.appendChild(item);
    });

    updateStats(visibleTasks.length);
    updateEmptyState(visibleTasks.length);
}

function updateStats(visibleCount) {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const active = total - completed;

    totalCount.textContent = total;
    activeCount.textContent = active;
    completedCount.textContent = completed;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    progressBar.style.width = percentage + "%";
    progressPercent.textContent = percentage + "%";
    progressTrack.setAttribute("aria-valuenow", percentage);

    clearCompletedBtn.disabled = completed === 0;
    clearCompletedBtn.style.opacity = completed === 0 ? "0.5" : "1";
    clearCompletedBtn.style.cursor = completed === 0 ? "not-allowed" : "pointer";
}

function updateEmptyState(visibleCount) {
    emptyState.hidden = visibleCount !== 0;

    if (tasks.length === 0) {
        emptyTitle.textContent = "Nothing here yet";
        emptyMessage.textContent = "Add your first task above to get started.";
    } else if (currentFilter === "active") {
        emptyTitle.textContent = "All caught up!";
        emptyMessage.textContent = "You have no active tasks.";
    } else if (currentFilter === "completed") {
        emptyTitle.textContent = "No completed tasks";
        emptyMessage.textContent = "Complete a task to see it here.";
    } else {
        emptyTitle.textContent = "No tasks found";
        emptyMessage.textContent = "Add a task to get started.";
    }
}

function editTask(id) {
    const task = tasks.find(task => task.id === id);

    if (!task) {
        return;
    }

    const newText = prompt("Edit your task:", task.text);

    if (newText === null) {
        return;
    }

    const trimmedText = newText.trim();

    if (!trimmedText) {
        alert("Task cannot be empty.");
        return;
    }

    if (trimmedText.length > 200) {
        alert("Task must be 200 characters or fewer.");
        return;
    }

    task.text = trimmedText;
    saveTasks();
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

filterButtons.forEach(button => {
    button.addEventListener("click", function () {
        currentFilter = button.dataset.filter;

        filterButtons.forEach(filterButton => {
            const isActive = filterButton === button;
            filterButton.classList.toggle("active", isActive);
            filterButton.setAttribute(
                "aria-pressed",
                String(isActive)
            );
        });

        renderTasks();
    });
});

clearCompletedBtn.addEventListener("click", function () {
    const hasCompleted = tasks.some(task => task.completed);

    if (!hasCompleted) {
        return;
    }

    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
    formMessage.textContent = "Completed tasks cleared.";
});

// Display saved tasks when the page opens
renderTasks();

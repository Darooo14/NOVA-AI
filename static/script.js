const chat = document.getElementById("chat");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");

let history = JSON.parse(localStorage.getItem("nova_history") || "[]");

document.addEventListener("DOMContentLoaded", () => {
    restoreChat();
    autoResize();
});

function handleKey(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

async function sendMessage() {
    const message = messageInput.value.trim();

    if (!message) return;

    addMessage("user", message);

    messageInput.value = "";
    autoResize();

    setLoading(true);

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                history: history
            })
        });

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();

        if (!data.reply) {
            throw new Error("Response tidak memiliki reply");
        }

        addMessage("assistant", data.reply);

    } catch (error) {
        console.error("AKA ERROR:", error);

        addMessage(
            "assistant",
            "⚠️ Gagal membaca respons dari server AKA."
        );
    }

    setLoading(false);
}

function addMessage(role, text) {
    const welcome = document.querySelector(".welcome");

    if (welcome) {
        welcome.remove();
    }

    const wrapper = document.createElement("div");
    wrapper.className = "message " + role;

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = role === "user" ? "👤" : "✦";

    const content = document.createElement("div");
    content.className = "message-content";

    content.innerHTML = formatText(text);

    wrapper.appendChild(avatar);
    wrapper.appendChild(content);

    chat.appendChild(wrapper);

    chat.scrollTop = chat.scrollHeight;

    history.push({
        role: role,
        text: text
    });

    history = history.slice(-20);

    localStorage.setItem(
        "nova_history",
        JSON.stringify(history)
    );
}

function formatText(text) {
    return escapeHTML(text)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\n/g, "<br>");
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function restoreChat() {
    if (!history.length) return;

    const welcome = document.querySelector(".welcome");

    if (welcome) {
        welcome.remove();
    }

    history.forEach(item => {
        const wrapper = document.createElement("div");
        wrapper.className = "message " + item.role;

        const avatar = document.createElement("div");
        avatar.className = "avatar";
        avatar.textContent =
            item.role === "user" ? "👤" : "✦";

        const content = document.createElement("div");
        content.className = "message-content";
        content.innerHTML = formatText(item.text);

        wrapper.appendChild(avatar);
        wrapper.appendChild(content);

        chat.appendChild(wrapper);
    });

    chat.scrollTop = chat.scrollHeight;
}

function setLoading(loading) {
    sendBtn.disabled = loading;

    if (loading) {
        sendBtn.textContent = "⏳";
    } else {
        sendBtn.textContent = "➤";
    }
}

function autoResize() {
    messageInput.style.height = "auto";
    messageInput.style.height =
        Math.min(messageInput.scrollHeight, 180) + "px";
}

messageInput.addEventListener("input", autoResize);

function newChat() {
    history = [];

    localStorage.removeItem("nova_history");

    location.reload();
}

function clearChat() {
    history = [];

    localStorage.removeItem("nova_history");

    location.reload();
}

function useSuggestion(text) {
    messageInput.value = text;
    autoResize();
    messageInput.focus();
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");

    if (sidebar) {
        sidebar.classList.toggle("open");
    }
}

/* MOBILE + DESKTOP ENTER */



/* AKA FORM SUBMIT */
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("chatForm");

    if (!form) return;

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        sendMessage();
    });
});

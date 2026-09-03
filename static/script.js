const chat = document.getElementById("chat");
const input = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");

let messages = JSON.parse(localStorage.getItem("nova_messages")) || [];

window.addEventListener("DOMContentLoaded", () => {
    if (messages.length > 0) {
        document.querySelector(".welcome")?.remove();

        messages.forEach(msg => {
            addMessage(msg.text, msg.sender, false);
        });

        chat.scrollTop = chat.scrollHeight;
    }

    input.focus();
});

// =========================
// KIRIM PESAN
// =========================
async function sendMessage() {
    const text = input.value.trim();

    if (!text || sendBtn.disabled) return;

    document.querySelector(".welcome")?.remove();

    addMessage(text, "user");
    saveMessage(text, "user");

    input.value = "";
    input.style.height = "auto";

    sendBtn.disabled = true;

    const loading = addLoading();

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: text,
                history: messages.slice(0, -1)
            })
        });

        if (!response.ok) {
            throw new Error("Server error: " + response.status);
        }

        const data = await response.json();

        loading.remove();

        addMessage(data.response, "ai");
        saveMessage(data.response, "ai");

    } catch (error) {
        console.error("ERROR:", error);

        loading.remove();

        addMessage(
            "⚠️ Gagal menghubungi server NOVA.",
            "ai"
        );
    }

    sendBtn.disabled = false;
    input.focus();
}

// =========================
// ENTER = KIRIM
// SHIFT + ENTER = BARIS BARU
// =========================
input.addEventListener("keydown", function(event) {

    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();

        sendMessage();
    }

});

// =========================
// AUTO RESIZE TEXTAREA
// =========================
input.addEventListener("input", function() {

    this.style.height = "auto";

    this.style.height =
        Math.min(this.scrollHeight, 150) + "px";

});

// =========================
// TAMBAH PESAN
// =========================
function addMessage(text, sender, scroll = true) {

    const wrapper = document.createElement("div");

    wrapper.className = "message " + sender;

    const avatar = document.createElement("div");

    avatar.className = "avatar";

    avatar.textContent =
        sender === "user" ? "👤" : "✦";

    const content = document.createElement("div");

    content.className = "message-content";

    if (sender === "ai") {

        content.innerHTML = renderMarkdown(text);

        const copy = document.createElement("button");

        copy.className = "copy-btn";

        copy.textContent = "📋 Copy";

        copy.onclick = () => {

            navigator.clipboard.writeText(text);

            copy.textContent = "✓ Copied";

            setTimeout(() => {
                copy.textContent = "📋 Copy";
            }, 1500);

        };

        content.appendChild(copy);

    } else {

        content.textContent = text;

    }

    wrapper.appendChild(avatar);
    wrapper.appendChild(content);

    chat.appendChild(wrapper);

    if (scroll) {
        chat.scrollTop = chat.scrollHeight;
    }
}

// =========================
// MARKDOWN
// =========================
function renderMarkdown(text) {

    let html = escapeHTML(text);

    html = html.replace(
        /```(\w+)?\n?([\s\S]*?)```/g,
        function(match, language, code) {

            const lang = language || "code";

            return `
                <div class="code-block">

                    <div class="code-header">
                        <span>${lang}</span>

                        <button onclick="copyCode(this)">
                            📋 Copy
                        </button>
                    </div>

                    <pre><code>${code.trim()}</code></pre>

                </div>
            `;
        }
    );

    html = html.replace(
        /`([^`]+)`/g,
        "<code class='inline-code'>$1</code>"
    );

    html = html.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    html = html.replace(
        /^### (.*)$/gm,
        "<h3>$1</h3>"
    );

    html = html.replace(
        /^## (.*)$/gm,
        "<h2>$1</h2>"
    );

    html = html.replace(
        /^# (.*)$/gm,
        "<h1>$1</h1>"
    );

    html = html.replace(
        /^[-*] (.*)$/gm,
        "<li>$1</li>"
    );

    html = html.replace(
        /(<li>.*<\/li>)/gs,
        "<ul>$1</ul>"
    );

    html = html.replace(/\n/g, "<br>");

    return html;
}

// =========================
// ESCAPE HTML
// =========================
function escapeHTML(text) {

    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// =========================
// COPY CODE
// =========================
function copyCode(button) {

    const code = button
        .closest(".code-block")
        .querySelector("code")
        .innerText;

    navigator.clipboard.writeText(code);

    button.textContent = "✓ Copied";

    setTimeout(() => {
        button.textContent = "📋 Copy";
    }, 1500);
}

// =========================
// LOADING
// =========================
function addLoading() {

    const wrapper = document.createElement("div");

    wrapper.className = "message ai";

    wrapper.innerHTML = `
        <div class="avatar">✦</div>

        <div class="message-content">

            <div class="typing">
                <span></span>
                <span></span>
                <span></span>
            </div>

        </div>
    `;

    chat.appendChild(wrapper);

    chat.scrollTop = chat.scrollHeight;

    return wrapper;
}

// =========================
// SIMPAN CHAT
// =========================
function saveMessage(text, sender) {

    messages.push({
        text: text,
        sender: sender
    });

    localStorage.setItem(
        "nova_messages",
        JSON.stringify(messages)
    );
}

// =========================
// NEW CHAT
// =========================
function newChat() {

    messages = [];

    localStorage.removeItem("nova_messages");

    chat.innerHTML = `
        <div class="welcome">

            <div class="welcome-logo">✦</div>

            <h1>Halo, aku NOVA 👋</h1>

            <p>
                Asisten AI pribadi kamu.
                Tanya apa saja dan kita mulai.
            </p>

            <div class="suggestions">

                <button onclick="useSuggestion('Jelaskan apa itu Python')">
                    💻 <span>Jelaskan Python</span>
                </button>

                <button onclick="useSuggestion('Bantu saya belajar')">
                    📚 <span>Bantu belajar</span>
                </button>

                <button onclick="useSuggestion('Berikan ide project keren')">
                    🚀 <span>Ide project</span>
                </button>

            </div>

        </div>
    `;

    input.value = "";

    input.focus();
}

// =========================
// CLEAR CHAT
// =========================
function clearChat() {

    if (messages.length === 0) return;

    if (confirm("Hapus semua percakapan NOVA?")) {
        newChat();
    }
}

// =========================
// SUGGESTION
// =========================
function useSuggestion(text) {

    input.value = text;

    input.focus();

    sendMessage();
}

// =========================
// SIDEBAR
// =========================
function toggleSidebar() {

    document
        .getElementById("sidebar")
        .classList.toggle("open");
}
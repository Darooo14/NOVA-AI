const chat = document.getElementById("chat");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");

let history = JSON.parse(
    localStorage.getItem("nova_history") || "[]"
);

document.addEventListener("DOMContentLoaded", () => {
    restoreChat();

    const form = document.getElementById("chatForm");

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            sendMessage();
        });
    }

    if (messageInput) {
        messageInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});


function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}


function inlineMarkdown(text) {
    let result = escapeHTML(text);

    result = result.replace(
        /`([^`\n]+)`/g,
        "<code>$1</code>"
    );

    result = result.replace(
        /\*\*(.+?)\*\*/g,
        "<strong>$1</strong>"
    );

    result = result.replace(
        /\*(.+?)\*/g,
        "<em>$1</em>"
    );

    return result;
}


function formatText(text) {

    if (!text) return "";

    text = String(text)
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");

    const lines = text.split("\n");

    let html = "";
    let paragraph = [];
    let listType = null;
    let listItems = [];
    let codeMode = false;
    let codeLines = [];


    function flushParagraph() {
        if (!paragraph.length) return;

        html += `
            <p>
                ${paragraph
                    .map(inlineMarkdown)
                    .join("<br>")}
            </p>
        `;

        paragraph = [];
    }


    function flushList() {
        if (!listItems.length) return;

        const tag =
            listType === "ol"
                ? "ol"
                : "ul";

        html += `<${tag}>`;

        listItems.forEach(item => {
            html += `<li>${inlineMarkdown(item)}</li>`;
        });

        html += `</${tag}>`;

        listItems = [];
        listType = null;
    }


    function flushCode() {
        if (!codeLines.length) return;

        html += `
            <pre><code>${escapeHTML(
                codeLines.join("\n")
            )}</code></pre>
        `;

        codeLines = [];
    }


    for (let i = 0; i < lines.length; i++) {

        const line = lines[i];


        /* CODE BLOCK */

        if (line.trim().startsWith("```")) {

            if (!codeMode) {

                flushParagraph();
                flushList();

                codeMode = true;

            } else {

                flushCode();

                codeMode = false;
            }

            continue;
        }


        if (codeMode) {
            codeLines.push(line);
            continue;
        }


        /* EMPTY */

        if (line.trim() === "") {

            flushParagraph();
            flushList();

            continue;
        }


        /* HEADING */

        const heading =
            line.match(/^(#{1,3})\s+(.+)$/);

        if (heading) {

            flushParagraph();
            flushList();

            const level =
                heading[1].length;

            html += `
                <h${level}>
                    ${inlineMarkdown(heading[2])}
                </h${level}>
            `;

            continue;
        }


        /* BULLET */

        const bullet =
            line.match(/^\s*[-*+]\s+(.+)$/);

        if (bullet) {

            flushParagraph();

            if (listType !== "ul") {
                flushList();
                listType = "ul";
            }

            listItems.push(bullet[1]);

            continue;
        }


        /* NUMBER */

        const number =
            line.match(/^\s*\d+[.)]\s+(.+)$/);

        if (number) {

            flushParagraph();

            if (listType !== "ol") {
                flushList();
                listType = "ol";
            }

            listItems.push(number[1]);

            continue;
        }


        if (listType) {
            flushList();
        }


        paragraph.push(line);
    }


    if (codeMode) {
        flushCode();
    }

    flushParagraph();
    flushList();

    return html;
}


function addMessage(role, text) {

    const welcome =
        document.querySelector(".welcome");

    if (welcome) {
        welcome.remove();
    }


    const wrapper =
        document.createElement("div");

    wrapper.className =
        "message " + role;


    const avatar =
        document.createElement("div");

    avatar.className = "avatar";

    avatar.textContent =
        role === "user"
            ? "👤"
            : "✦";


    const content =
        document.createElement("div");

    content.className =
        "message-content";

    content.innerHTML =
        formatText(text);


    wrapper.appendChild(avatar);
    wrapper.appendChild(content);

    chat.appendChild(wrapper);


    history.push({
        role: role,
        text: text
    });

    history =
        history.slice(-20);

    localStorage.setItem(
        "nova_history",
        JSON.stringify(history)
    );


    scrollToBottom();
}


async function sendMessage() {

    const message =
        messageInput.value.trim();

    if (!message) return;


    const requestHistory =
        history.slice(-10);


    addMessage(
        "user",
        message
    );


    messageInput.value = "";


    if (sendBtn) {
        sendBtn.disabled = true;
    }


    try {

        const response =
            await fetch("/chat", {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    message: message,
                    history: requestHistory
                })
            });


        if (!response.ok) {
            throw new Error(
                "HTTP " + response.status
            );
        }


        const data =
            await response.json();


        if (!data.reply) {
            throw new Error(
                "Respons AI kosong"
            );
        }


        addMessage(
            "assistant",
            data.reply
        );


    } catch (error) {

        console.error(
            "AKA ERROR:",
            error
        );

        addMessage(
            "assistant",
            "⚠️ Gagal membaca respons dari server AKA."
        );

    }


    if (sendBtn) {
        sendBtn.disabled = false;
    }

    messageInput.focus();
}


function restoreChat() {

    if (!history.length) return;


    const welcome =
        document.querySelector(".welcome");

    if (welcome) {
        welcome.remove();
    }


    history.forEach(item => {

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "message " + item.role;


        const avatar =
            document.createElement("div");

        avatar.className = "avatar";

        avatar.textContent =
            item.role === "user"
                ? "👤"
                : "✦";


        const content =
            document.createElement("div");

        content.className =
            "message-content";

        content.innerHTML =
            formatText(item.text);


        wrapper.appendChild(avatar);
        wrapper.appendChild(content);

        chat.appendChild(wrapper);
    });


    scrollToBottom();
}


function scrollToBottom() {

    if (!chat) return;

    requestAnimationFrame(() => {
        chat.scrollTop =
            chat.scrollHeight;
    });
}


function useSuggestion(text) {

    if (!messageInput) return;

    messageInput.value = text;
    messageInput.focus();
}


function clearChat() {

    history = [];

    localStorage.removeItem(
        "nova_history"
    );

    location.reload();
}


function toggleSidebar() {

    const sidebar =
        document.getElementById("sidebar");

    if (sidebar) {
        sidebar.classList.toggle("open");
    }
}

/* =========================================================
   AKA AI — FULL SCRIPT
   Clean Markdown Renderer + Streaming + Chat History
   ========================================================= */

const chat = document.getElementById("chat");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");

let history = JSON.parse(
    localStorage.getItem("nova_history") || "[]"
);


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    restoreChat();

    const form = document.getElementById("chatForm");

    if (form) {
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            sendMessage();
        });
    }

    if (messageInput) {

        messageInput.addEventListener("keydown", function (event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.isComposing
            ) {
                event.preventDefault();
                sendMessage();
            }

        });

    }

    setupSuggestionButtons();

});


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


/* =========================================================
   INLINE MARKDOWN
   ========================================================= */

function formatInline(text) {

    let result = escapeHTML(text);

    /* Inline code */

    result = result.replace(
        /`([^`\n]+)`/g,
        "<code>$1</code>"
    );


    /* Bold */

    result = result.replace(
        /\*\*(.+?)\*\*/g,
        "<strong>$1</strong>"
    );

    result = result.replace(
        /__(.+?)__/g,
        "<strong>$1</strong>"
    );


    /* Italic */

    result = result.replace(
        /(^|[^\*])\*([^*\n]+)\*(?!\*)/g,
        "$1<em>$2</em>"
    );

    result = result.replace(
        /(^|[^_])_([^_\n]+)_(?!_)/g,
        "$1<em>$2</em>"
    );


    /* Links */

    result = result.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );


    /* URL */

    result = result.replace(
        /(^|[\s>])(https?:\/\/[^\s<]+)/g,
        '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>'
    );


    return result;

}


/* =========================================================
   MARKDOWN RENDERER
   ========================================================= */

function formatText(text) {

    if (
        text === null ||
        text === undefined
    ) {
        return "";
    }


    text = String(text)
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");


    const lines = text.split("\n");

    let html = "";

    let paragraph = [];

    let listType = null;

    let listItems = [];

    let inCodeBlock = false;

    let codeLanguage = "";

    let codeLines = [];


    /* -----------------------------------------------------
       PARAGRAPH
       ----------------------------------------------------- */

    function flushParagraph() {

        if (!paragraph.length) {
            return;
        }


        const content = paragraph
            .map(line => formatInline(line))
            .join("<br>");


        html += `
            <p>${content}</p>
        `;


        paragraph = [];

    }


    /* -----------------------------------------------------
       LIST
       ----------------------------------------------------- */

    function flushList() {

        if (!listItems.length) {
            return;
        }


        const tag =
            listType === "ol"
                ? "ol"
                : "ul";


        html += `<${tag}>`;


        listItems.forEach(item => {

            html += `
                <li>
                    ${formatInline(item)}
                </li>
            `;

        });


        html += `</${tag}>`;


        listItems = [];

        listType = null;

    }


    /* -----------------------------------------------------
       CODE
       ----------------------------------------------------- */

    function flushCode() {

        if (!inCodeBlock) {
            return;
        }


        const code =
            escapeHTML(
                codeLines.join("\n")
            );


        const language =
            codeLanguage
                ? ` class="language-${escapeHTML(codeLanguage)}"`
                : "";


        html += `
            <pre><code${language}>${code}</code></pre>
        `;


        codeLines = [];

        codeLanguage = "";

        inCodeBlock = false;

    }


    /* -----------------------------------------------------
       PROCESS
       ----------------------------------------------------- */

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const rawLine = lines[i];

        const line = rawLine.trimEnd();


        /* =================================================
           CODE BLOCK
           ================================================= */

        if (
            line.trim().startsWith("```")
        ) {

            if (!inCodeBlock) {

                flushParagraph();

                flushList();

                inCodeBlock = true;

                codeLanguage =
                    line
                        .trim()
                        .substring(3)
                        .trim();

            } else {

                flushCode();

            }

            continue;

        }


        if (inCodeBlock) {

            codeLines.push(rawLine);

            continue;

        }


        /* =================================================
           EMPTY LINE
           ================================================= */

        if (
            line.trim() === ""
        ) {

            flushParagraph();

            flushList();

            continue;

        }


        /* =================================================
           HEADING
           ================================================= */

        const heading =
            line.match(
                /^(#{1,4})\s+(.+)$/
            );


        if (heading) {

            flushParagraph();

            flushList();


            const level =
                heading[1].length;


            html += `
                <h${level}>
                    ${formatInline(heading[2])}
                </h${level}>
            `;


            continue;

        }


        /* =================================================
           HORIZONTAL LINE
           ================================================= */

        if (
            /^-{3,}$/.test(line.trim()) ||
            /^\*{3,}$/.test(line.trim()) ||
            /^_{3,}$/.test(line.trim())
        ) {

            flushParagraph();

            flushList();

            html += "<hr>";

            continue;

        }


        /* =================================================
           BLOCKQUOTE
           ================================================= */

        if (
            line.trim().startsWith(">")
        ) {

            flushParagraph();

            flushList();


            const quoteLines = [];

            let j = i;


            while (
                j < lines.length &&
                lines[j]
                    .trim()
                    .startsWith(">")
            ) {

                quoteLines.push(
                    lines[j]
                        .trim()
                        .replace(
                            /^>\s?/,
                            ""
                        )
                );


                j++;

            }


            html += `
                <blockquote>
                    <p>
                        ${quoteLines
                            .map(formatInline)
                            .join("<br>")}
                    </p>
                </blockquote>
            `;


            i = j - 1;

            continue;

        }


        /* =================================================
           BULLET
           ================================================= */

        const bullet =
            line.match(
                /^\s*[-*+]\s+(.+)$/
            );


        if (bullet) {

            flushParagraph();


            if (listType !== "ul") {

                flushList();

                listType = "ul";

            }


            listItems.push(
                bullet[1]
            );


            continue;

        }


        /* =================================================
           NUMBERED LIST
           ================================================= */

        const numbered =
            line.match(
                /^\s*\d+[.)]\s+(.+)$/
            );


        if (numbered) {

            flushParagraph();


            if (listType !== "ol") {

                flushList();

                listType = "ol";

            }


            listItems.push(
                numbered[1]
            );


            continue;

        }


        /* =================================================
           NORMAL TEXT
           ================================================= */

        if (listType) {
            flushList();
        }


        paragraph.push(line);

    }


    /* =====================================================
       FINALIZE
       ===================================================== */

    if (inCodeBlock) {
        flushCode();
    }


    flushParagraph();

    flushList();


    return html;

}


/* =========================================================
   ADD MESSAGE
   ========================================================= */

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

    avatar.className =
        "avatar";

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


    scrollToBottom();


    history.push({
        role: role,
        text: text
    });


    history =
        history.slice(-20);


    saveHistory();


    return content;

}


/* =========================================================
   SAVE HISTORY
   ========================================================= */

function saveHistory() {

    localStorage.setItem(
        "nova_history",
        JSON.stringify(history)
    );

}


/* =========================================================
   RESTORE CHAT
   ========================================================= */

function restoreChat() {

    if (!history.length) {
        return;
    }


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

        avatar.className =
            "avatar";

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


/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage() {

    if (!messageInput) {
        return;
    }


    const message =
        messageInput.value.trim();


    if (!message) {
        return;
    }


    /*
     * History sebelum pesan baru.
     * Ini mencegah pesan terakhir dikirim dua kali.
     */

    const requestHistory =
        history.slice(-10);


    addMessage(
        "user",
        message
    );


    messageInput.value = "";


    setLoading(true);


    try {

        const response =
            await fetch(
                "/chat-stream",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message: message,
                        history: requestHistory
                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        /*
         * Buat bubble AKA.
         */

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "message assistant";


        const avatar =
            document.createElement("div");

        avatar.className =
            "avatar";

        avatar.textContent =
            "✦";


        const content =
            document.createElement("div");

        content.className =
            "message-content";


        wrapper.appendChild(avatar);

        wrapper.appendChild(content);

        chat.appendChild(wrapper);


        /*
         * Streaming
         */

        if (response.body) {

            const reader =
                response.body.getReader();

            const decoder =
                new TextDecoder("utf-8");

            let fullText = "";


            while (true) {

                const {
                    value,
                    done
                } = await reader.read();


                if (done) {
                    break;
                }


                const chunk =
                    decoder.decode(
                        value,
                        {
                            stream: true
                        }
                    );


                fullText += chunk;


                /*
                 * Render Markdown
                 * setiap chunk.
                 */

                content.innerHTML =
                    formatText(
                        fullText
                    );


                scrollToBottom();

            }


            /*
             * Flush decoder.
             */

            fullText +=
                decoder.decode();


            content.innerHTML =
                formatText(
                    fullText
                );


            /*
             * Simpan jawaban AKA.
             */

            history.push({
                role: "assistant",
                text: fullText
            });


            history =
                history.slice(-20);


            saveHistory();

        } else {

            /*
             * Fallback JSON
             */

            const data =
                await response.json();


            const reply =
                data.reply ||
                "Tidak ada respons.";


            content.innerHTML =
                formatText(reply);


            history.push({
                role: "assistant",
                text: reply
            });


            history =
                history.slice(-20);


            saveHistory();

        }


    } catch (error) {

        console.error(
            "AKA ERROR:",
            error
        );


        /*
         * Hapus bubble kosong
         * kalau request gagal.
         */

        const emptyMessages =
            chat.querySelectorAll(
                ".message.assistant"
            );


        const last =
            emptyMessages[
                emptyMessages.length - 1
            ];


        if (
            last &&
            !last
                .querySelector(
                    ".message-content"
                )
                .textContent.trim()
        ) {

            last.remove();

        }


        addMessage(
            "assistant",
            "⚠️ Gagal membaca respons dari server AKA."
        );

    }


    setLoading(false);

}


/* =========================================================
   LOADING
   ========================================================= */

function setLoading(loading) {

    if (!sendBtn) {
        return;
    }


    sendBtn.disabled =
        loading;


    sendBtn.classList.toggle(
        "loading",
        loading
    );


    if (loading) {

        sendBtn.dataset.oldText =
            sendBtn.textContent;

        sendBtn.textContent =
            "•";

    } else {

        sendBtn.textContent =
            sendBtn.dataset.oldText ||
            "➤";

    }

}


/* =========================================================
   SCROLL
   ========================================================= */

function scrollToBottom() {

    if (!chat) {
        return;
    }


    requestAnimationFrame(() => {

        chat.scrollTo({
            top: chat.scrollHeight,
            behavior: "smooth"
        });

    });

}


/* =========================================================
   SUGGESTIONS
   ========================================================= */

function setupSuggestionButtons() {

    const buttons =
        document.querySelectorAll(
            "[data-suggestion]"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const text =
                    button.dataset.suggestion;

                useSuggestion(text);

            }
        );

    });

}


function useSuggestion(text) {

    if (!messageInput) {
        return;
    }


    messageInput.value =
        text;


    messageInput.focus();

}


/* =========================================================
   CLEAR CHAT
   ========================================================= */

function clearChat() {

    history = [];


    localStorage.removeItem(
        "nova_history"
    );


    if (chat) {

        const messages =
            chat.querySelectorAll(
                ".message"
            );


        messages.forEach(
            message =>
                message.remove()
        );

    }


    location.reload();

}


/* =========================================================
   SIDEBAR
   ========================================================= */

function toggleSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    if (sidebar) {

        sidebar.classList.toggle(
            "open"
        );

    }

}


/* =========================================================
   ATTACH BUTTON
   ========================================================= */

const attachBtn =
    document.getElementById(
        "attachBtn"
    );


if (attachBtn) {

    attachBtn.addEventListener(
        "click",
        function () {

            console.log(
                "Attachment belum diaktifkan."
            );

        }
    );

}

from flask import Flask, render_template, request, jsonify
from openai import OpenAI
import os

app = Flask(__name__)

# =========================
# OPENROUTER
# =========================

API_KEY = os.getenv("OPENROUTER_API_KEY")

client = None

if API_KEY:
    client = OpenAI(
        api_key=API_KEY,
        base_url="https://openrouter.ai/api/v1"
    )


# =========================
# AI CHAT
# =========================

def ask_ai(message, history):

    if client is None:
        return "OPENROUTER_API_KEY belum terpasang."

    messages = [
        {
            "role": "system",
            "content": (
                "Kamu adalah NOVA AI, asisten AI yang ramah, pintar, "
                "dan membantu. Jawab dalam bahasa pengguna. "
                "Berikan jawaban yang jelas dan mudah dipahami."
            )
        }
    ]

    # Memory percakapan
    for item in history[-10:]:

        if item.get("role") == "user":
            messages.append({
                "role": "user",
                "content": item.get("text", "")
            })

        elif item.get("role") == "assistant":
            messages.append({
                "role": "assistant",
                "content": item.get("text", "")
            })

    # Pesan terbaru
    messages.append({
        "role": "user",
        "content": message
    })

    try:

        response = client.chat.completions.create(
            model="openrouter/free",
            messages=messages,
            max_tokens=700,
            temperature=0.7
        )

        return response.choices[0].message.content

    except Exception as e:

        print("ERROR AI:", repr(e))

        return f"ERROR AI: {e}"


# =========================
# HOME
# =========================

@app.route("/")
def home():
    return render_template("index.html")


# =========================
# CHAT API
# =========================

@app.route("/chat", methods=["POST"])
def chat():

    data = request.get_json()

    if not data:
        return jsonify({
            "reply": "Data tidak diterima."
        })

    message = data.get("message", "").strip()

    history = data.get("history", [])

    if not message:
        return jsonify({
            "reply": "Pesannya masih kosong 😄"
        })

    reply = ask_ai(message, history)

    return jsonify({
        "reply": reply
    })


# =========================
# ABOUT
# =========================

@app.route("/about")
def about():

    return """
    <!DOCTYPE html>
    <html lang="id">

    <head>

        <meta charset="UTF-8">

        <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
        >

        <title>Tentang NOVA AI — Asisten AI Online</title>

        <meta
            name="description"
            content="NOVA AI adalah asisten AI online untuk membantu belajar, coding, menjawab pertanyaan, dan berbagai kebutuhan sehari-hari."
        >

    </head>

    <body>

        <h1>NOVA AI</h1>

        <p>
            NOVA AI adalah asisten AI online yang membantu pengguna
            menjawab pertanyaan, belajar, coding, dan berbagai kebutuhan
            sehari-hari.
        </p>

        <h2>Fitur NOVA AI</h2>

        <ul>
            <li>Chat dengan AI</li>
            <li>Membantu belajar</li>
            <li>Membantu coding</li>
            <li>Menjawab berbagai pertanyaan</li>
        </ul>

        <h2>Tentang NOVA</h2>

        <p>
            NOVA dirancang sebagai asisten AI sederhana yang dapat
            digunakan secara online melalui browser.
        </p>

        <p>
            <a href="/">Buka NOVA AI</a>
        </p>

    </body>

    </html>
    """


# =========================
# ROBOTS.TXT
# =========================

@app.route("/robots.txt")
def robots():

    return """User-agent: *
Allow: /

Sitemap: https://1athaadaichiro1.pythonanywhere.com/sitemap.xml
""", 200, {
        "Content-Type": "text/plain"
    }


# =========================
# SITEMAP.XML
# =========================

@app.route("/sitemap.xml")
def sitemap():

    xml = """<?xml version="1.0" encoding="UTF-8"?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

    <url>
        <loc>https://1athaadaichiro1.pythonanywhere.com/</loc>
    </url>

    <url>
        <loc>https://1athaadaichiro1.pythonanywhere.com/about</loc>
    </url>

</urlset>
"""

    return xml, 200, {
        "Content-Type": "application/xml"
    }


# =========================
# LOCAL SERVER
# =========================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )

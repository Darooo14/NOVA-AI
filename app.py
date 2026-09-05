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
# AI
# =========================

def ask_ai(message, history):

    if client is None:
        return "OPENROUTER_API_KEY belum terpasang."

    messages = [
        {
            "role": "system",
            "content": (
                "Kamu adalah NOVA AI, asisten AI pribadi yang pintar, "
                "ramah, cepat, dan membantu. "
                "Jawab dalam bahasa yang digunakan pengguna. "
                "Berikan jawaban yang jelas, natural, dan mudah dipahami."
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
# HALAMAN UTAMA
# =========================

@app.route("/")
def home():
    return render_template("index.html")


# =========================
# CHAT
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
# ROBOTS.TXT
# =========================

@app.route("/robots.txt")
def robots():

    text = """User-agent: *
Allow: /

Sitemap: https://1athaadaichiro1.pythonanywhere.com/sitemap.xml
"""

    return text, 200, {
        "Content-Type": "text/plain"
    }


# =========================
# SITEMAP
# =========================

@app.route("/sitemap.xml")
def sitemap():

    xml = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

    <url>
        <loc>https://1athaadaichiro1.pythonanywhere.com/</loc>
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

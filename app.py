from flask import Flask, render_template, request, jsonify
from datetime import datetime
import os
import re
from huggingface_hub import InferenceClient

app = Flask(__name__)

HF_TOKEN = os.getenv("HF_TOKEN")

if HF_TOKEN:
    client = InferenceClient(
        api_key=HF_TOKEN,
        provider="auto"
    )
else:
    client = None


# =========================
# AI DENGAN MEMORY
# =========================

def ask_ai(message, history):
    if client is None:
        return "HF_TOKEN belum terpasang."

    try:
        messages = [
            {
                "role": "system",
                "content": (
                    "Kamu adalah NOVA AI, asisten AI yang ramah, "
                    "cerdas, jelas, dan membantu. "
                    "Gunakan bahasa Indonesia jika pengguna menggunakan "
                    "bahasa Indonesia. "
                    "Ingat dan gunakan konteks percakapan sebelumnya "
                    "dalam chat ini."
                )
            }
        ]

        # Masukkan percakapan sebelumnya
        for item in history:
            if item.get("sender") == "user":
                messages.append({
                    "role": "user",
                    "content": item.get("text", "")
                })

            elif item.get("sender") == "ai":
                messages.append({
                    "role": "assistant",
                    "content": item.get("text", "")
                })

        # Pesan terbaru
        messages.append({
            "role": "user",
            "content": message
        })

        response = client.chat.completions.create(
            model="deepseek-ai/DeepSeek-V3-0324",
            messages=messages,
            max_tokens=500,
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
# CHAT
# =========================

@app.route("/chat", methods=["POST"])
def chat():

    data = request.json or {}

    message = data.get("message", "").strip()

    # Ambil history dari browser
    history = data.get("history", [])

    lower = message.lower()

    if not message:
        return jsonify({
            "response": "Tulis sesuatu dulu 😄"
        })


    # =========================
    # JAM
    # =========================

    if "jam berapa" in lower or "sekarang jam" in lower:

        waktu = datetime.now().strftime("%H:%M:%S")

        return jsonify({
            "response": f"Sekarang pukul **{waktu}** ⏰"
        })


    # =========================
    # TANGGAL
    # =========================

    if "tanggal berapa" in lower or "hari apa" in lower:

        sekarang = datetime.now()

        tanggal = sekarang.strftime("%d-%m-%Y")
        hari = sekarang.strftime("%A")

        hari_id = {
            "Monday": "Senin",
            "Tuesday": "Selasa",
            "Wednesday": "Rabu",
            "Thursday": "Kamis",
            "Friday": "Jumat",
            "Saturday": "Sabtu",
            "Sunday": "Minggu"
        }

        return jsonify({
            "response": (
                f"Hari ini **{hari_id.get(hari, hari)}**, "
                f"{tanggal} 📅"
            )
        })


    # =========================
    # KALKULATOR
    # =========================

    if lower.startswith("hitung "):

        expression = message[7:].strip()

        if re.fullmatch(r"[0-9+\-*/(). %]+", expression):

            try:

                result = eval(
                    expression,
                    {"__builtins__": None},
                    {}
                )

                return jsonify({
                    "response": f"Hasilnya adalah **{result}** 🧮"
                })

            except Exception:

                return jsonify({
                    "response": "Hmm, perhitungannya tidak valid 😅"
                })


    # =========================
    # SAPAAN
    # =========================

    if lower in ["halo", "hai", "hello", "hey"]:

        return jsonify({
            "response": (
                "Halo! 👋 Aku NOVA AI. "
                "Ada yang bisa aku bantu?"
            )
        })


    # =========================
    # IDENTITAS
    # =========================

    if "siapa kamu" in lower or "kamu siapa" in lower:

        return jsonify({
            "response": (
                "Aku **NOVA AI** 🤖, "
                "asisten AI buatan kamu."
            )
        })


    # =========================
    # TERIMA KASIH
    # =========================

    if "makasih" in lower or "terima kasih" in lower:

        return jsonify({
            "response": "Sama-sama! 😎"
        })


    # =========================
    # HELP
    # =========================

    if lower in ["help", "bantuan", "tolong"]:

        return jsonify({
            "response": """
### 🚀 NOVA AI

Sekarang aku bisa:

- 🤖 Chat dengan AI
- 🧠 Mengingat konteks percakapan
- 🕐 Menampilkan waktu
- 📅 Menampilkan tanggal
- 🧮 Kalkulator
- 💬 Menjawab pertanyaan
- 💻 Membantu coding
- 📚 Membantu belajar

Contoh:

`jam berapa sekarang`

`hitung 25 * 4`

atau langsung tanyakan sesuatu ke NOVA.
"""
        })


    # =========================
    # AI
    # =========================

    response = ask_ai(message, history)

    return jsonify({
        "response": response
    })


# =========================
# START SERVER
# =========================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
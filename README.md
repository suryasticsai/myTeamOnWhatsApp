<div align="center">
  <img src="https://img.icons8.com/color/96/000000/whatsapp--v1.png" alt="WhatsApp Logo" width="80" />
  <h1>📱 My Team On WhatsApp </h1>
  <p><strong>A fully functional WhatsApp‑style chat interface with AI‑powered team members</strong></p>

  <p>
    <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
    <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
    <img src="https://img.shields.io/badge/RAGina-00A884?style=for-the-badge&logo=ai&logoColor=white" alt="RAGina" />
  </p>
  <p>
    <img src="https://img.shields.io/badge/Status-Live-brightgreen?style=flat-square" alt="Status" />
    <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License" />
  </p>
</div>

---

## ✨ Overview

**Mammoth – CW RUN** is a realistic, single‑page WhatsApp‑style chat application that brings your team’s conversations to life. It comes pre‑loaded with a complete history from a real PI Planning group (Mammoth – CW RUN) and uses **RAGina** to generate context‑aware, persona‑driven replies from each team member.

With features like @mentions, reply threading, reactions, voice messages, and persistent storage, this project demonstrates how AI can seamlessly integrate into familiar communication tools.

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| **📜 Full chat history** | Pre‑populated with real messages from the Mammoth – CW RUN group (July 2026). |
| **🧠 AI‑powered replies** | Each team member (Sanchita, Sivaram, Sunkul, Yamini, Laik) has a distinct personality and responds accordingly. |
| **@mentions** | Type `@` followed by a name to tag a specific member – they will reply within seconds. |
| **💬 Reply threading** | Right‑click any message to reply directly, with a quote card appearing above the input. |
| **❤️ Reactions & stars** | Double‑click to add a ❤️ reaction; right‑click to star messages. |
| **🎤 Voice messages** | Record and send short voice clips (simulated waveform). |
| **📱 Fully responsive** | Works flawlessly on both desktop and mobile devices. |
| **💾 Persistent storage** | All messages are saved in `localStorage` – your conversations survive page refreshes. |
| **🔒 End‑to‑end encryption** | Not real encryption, but the UI mimics WhatsApp’s security notice for realism. |

---

## 🧠 How It Works

### RAGina AI Engine

This project leverages **RAGina** – a lightweight RAG (Retrieval‑Augmented Generation) service – to generate intelligent, in‑character replies.

- **Retrieval:** When you send a message, the app optionally retrieves relevant knowledge snippets from a provided team wiki/Confluence URL (via the `/api/crawl` endpoint) using TF‑IDF ranking.
- **LLM Generation:** The prompt is built with:
  - The selected team member’s persona (role, personality, emoji style)
  - Recent conversation history (last ~14 messages)
  - The current user message
  - (Optional) retrieved knowledge context
  - If replying to a specific message, that quote is also included.
- **Persona‑based responses:** Each member has a unique vibe (e.g., Sanchita is process‑oriented, Laik is chill and uses Hinglish). The AI is instructed to mimic these styles faithfully.
- **Fallback:** If the LLM is unavailable, the app uses a set of predefined fallback responses to keep the conversation flowing.

### Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript – no external libraries.
- **AI Backend:** RAGina (custom API endpoints for crawling and generation).
- **Storage:** Browser `localStorage`.

---

## 📦 Installation & Usage

### 1. Clone or download the repository

```bash
git clone https://github.com/your-username/mammoth-cw-run.git
cd mammoth-cw-run
```

### 2. Open the app

Simply open `index.html` in your favourite browser. No build steps, no dependencies – it just works.

### 3. Start chatting

- The group chat **Mammoth – CW RUN** is pre‑selected with the full history.
- Type a message in the input box at the bottom and press Enter (or click the send icon).
- Use `@` followed by a team member’s name to mention them (e.g., `@Sanchita`).
- Right‑click any message to reply, react, star, or delete.

### 4. (Optional) Load team knowledge

Click the menu (☰) → **Load team knowledge (RAGina)** and paste a URL to a team wiki or documentation. The app will crawl and index it, making the AI’s answers more context‑aware.

---

## 🖼️ Screenshots

<div align="center">
  <img src="https://via.placeholder.com/800x400/0b141a/e9edef?text=Chat+View" alt="Chat View" width="80%" />
  <br />
  <em>Main chat interface – group conversation with AI replies.</em>
</div>

<div align="center">
  <img src="https://via.placeholder.com/300x600/0b141a/e9edef?text=Mobile+View" alt="Mobile View" width="30%" />
  <img src="https://via.placeholder.com/300x600/0b141a/e9edef?text=Reply+Threading" alt="Reply Threading" width="30%" />
  <br />
  <em>Mobile responsive design and reply threading.</em>
</div>

---

## 📁 File Structure

```
.
├── index.html          # Complete single‑file application (HTML + CSS + JS)
└── README.md           # This file
```

---

## 🔧 Customization

### Add your own team knowledge

1. Click the menu (☰) → **Load team knowledge (RAGina)**.
2. Enter the URL of your team’s wiki, Confluence page, or any public documentation.
3. The app will crawl, chunk, and index the content – the AI will then use it to answer questions more accurately.

### Modify personas

Each team member’s personality is defined in the `PERSONAS` object inside `index.html`. You can tweak the `vibe`, `emojiHint`, and `role` fields to change how they reply.

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests for improvements.

---

## 📄 License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/suryasticsai">Sai Surya</a> & the Mammoth team
</div>
<div align="center">
  <img src="https://raw.githubusercontent.com/suryasticsai/myTeamOnWhatsApp/refs/heads/main/personasoi.png" alt="Personasoi Logo" width="120" />
  <h1>📱 Simulate your own Team On WhatsApp</h1>
  <p><strong>A gamified WhatsApp‑style chat + full Persona Manager with GitHub sync</strong></p>

  <p>
    <a href="https://suryasticsai.github.io/myTeamOnWhatsApp" target="_blank">
      <strong>🔗 Live Chat Demo</strong>
    </a>
    &nbsp;·&nbsp;
    <a href="https://suryasticsai.github.io/myTeamOnWhatsApp/personaManager.html" target="_blank">
      <strong>🔗 Persona Manager</strong>
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
    <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
    <img src="https://img.shields.io/badge/RAGina-00A884?style=for-the-badge&logo=ai&logoColor=white" alt="RAGina" />
    <img src="https://img.shields.io/badge/GitHub_OAuth-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub OAuth" />
  </p>
  <p>
    <img src="https://img.shields.io/badge/Status-Live-brightgreen?style=flat-square" alt="Status" />
    <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License" />
  </p>
</div>

---

## ✨ Overview

This repository contains **two powerful tools** that work together:

1. **🧠 WhatsApp Chat Simulation** – a fully functional WhatsApp‑style chat interface with AI‑powered team members. Each member has a unique persona and responds intelligently to your messages.

2. **🎮 Persona Manager** – a standalone character creator that lets you **design, edit, clone, and batch‑import** personas, then **sync them to GitHub** with one click. Built with a sleek “Storm HUD” aesthetic and OAuth login.

3. **🎭 Gamified Roleplay** – you can **assume the identity of any team member** and reply as them in the chat. The UI highlights your chosen character, and the AI adjusts its responses to stay in character.

---

## 🚀 Features

### 📱 Chat Simulation

| Feature | Description |
|---------|-------------|
| **📜 Full chat history** | Pre‑populated with real messages from the Team group (July 2026). |
| **🧠 AI‑powered replies** | Each team member (Sanchita, Sivaram, Sunkul, Yamini, Laik) has a distinct personality and responds accordingly. |
| **@mentions** | Type `@` followed by a name to tag a specific member – they will reply within seconds. |
| **💬 Reply threading** | Right‑click any message to reply directly, with a quote card appearing above the input. |
| **❤️ Reactions & stars** | Double‑click to add a ❤️ reaction; right‑click to star messages. |
| **🎤 Voice messages** | Record and send short voice clips (simulated waveform). |
| **📱 Fully responsive** | Works flawlessly on both desktop and mobile devices. |
| **💾 Persistent storage** | All messages are saved in `localStorage` – your conversations survive page refreshes. |
| **🔒 End‑to‑end encryption** | UI mimics WhatsApp’s security notice for realism. |

---

### 🎭 Gamified Roleplay

| Feature | Description |
|---------|-------------|
| **🎭 Pick a character** | Click on any team member’s avatar or name in the chat header to **roleplay as them**. |
| **👤 Your messages become theirs** | When you send a message, it appears as if it came from that character – complete with their avatar and color. |
| **🧠 AI stays in character** | The AI continues to reply as other team members, maintaining the conversational flow. |
| **🔄 Switch anytime** | Change your role mid‑conversation – the chat adapts instantly. |
| **🏆 Immersive experience** | Feel like you’re part of the team – great for training, storytelling, or just fun. |

---

### 🎮 Persona Manager (standalone)

| Feature | Description |
|---------|-------------|
| **👤 GitHub OAuth Login** | Sign in with your GitHub account – avatar and username appear instantly. |
| **💾 Save to GitHub** | One‑click commit of `persona.json` directly to your repo. |
| **🤖 RAGina Auto‑fill** | Paste a bio (e.g., *“Riya — loves K‑dramas, sharp with Python…”*) – the form auto‑populates all fields. |
| **📋 Batch Import** | Paste multiple bios (one per line) to create dozens of personas at once. |
| **✏️ Full CRUD** | Create, edit, clone, and delete personas – all with a beautiful card‑based UI. |
| **🎨 Storm HUD Design** | Sci‑fi aesthetic with animated sky, lightning, and a game‑style loading screen. |
| **🌙 Preferences** | Toggle theme color, sounds, and dark mode (always‑on). |
| **📥 Export / Import JSON** | Download or upload your entire persona collection. |

---

## 🧠 How It Works

### RAGina AI Engine (Chat)

The chat app uses **RAGina** – a lightweight RAG (Retrieval‑Augmented Generation) service – to generate intelligent, in‑character replies.

- **Retrieval:** Optionally fetches relevant knowledge from a team wiki/Confluence URL (via `/api/crawl`) using TF‑IDF ranking.
- **LLM Generation:** The prompt is built with:
  - The selected team member’s persona (vibe, role, emoji style)
  - Recent conversation history (last ~14 messages)
  - The user’s message (or the roleplayed character’s message)
  - (Optional) retrieved knowledge context
  - A quote if replying to a specific message.
- **Fallback:** If the LLM is unavailable, predefined fallback responses keep the chat flowing.

### Persona Manager & GitHub Sync

1. **OAuth Flow:** Users sign in with GitHub via a Cloudflare Worker proxy – the token is exchanged securely.
2. **Data Sync:** Every change (add/edit/delete) automatically commits `persona.json` to the user’s repo.
3. **RAGina Auto‑fill:** Uses pattern‑matching to extract name, role, languages, vibe, catchphrases, memes, and quirks from a free‑text bio.
4. **Batch Import:** Processes multiple bios at once – perfect for onboarding an entire team.

---

## 📦 Installation & Usage

### 1. Clone or download the repository

```bash
git clone https://github.com/suryasticsai/myTeamOnWhatsApp.git
cd myTeamOnWhatsApp
```

2. Open the app

Simply open index.html in your favourite browser – no build steps, no dependencies. It just works.

3. Start chatting

· The group chat is pre‑selected with a full history.
· Type a message in the input box at the bottom and press Enter.
· Use @ followed by a team member’s name to mention them (e.g., @Sanchita).
· Right‑click any message to reply, react, star, or delete.

4. Roleplay as any character

· Click on any team member’s avatar or name in the chat header.
· Your next messages will be sent as that character – the AI will respond accordingly.
· Switch roles anytime by clicking another avatar.

5. Manage personas with the Persona Manager

· Open personaManager.html from the same folder.
· Sign in with GitHub (optional – works offline too).
· Add, edit, clone, or batch‑import personas.
· Click “Save to Repo” to push your collection to GitHub.

6. (Optional) Load team knowledge

Click the menu (☰) → Load team knowledge (RAGina) and paste a URL to a team wiki or documentation. The app will crawl and index it, making the AI’s answers more context‑aware.

---

🖼️ Screenshots

<div align="center">
  <img src="https://raw.githubusercontent.com/suryasticsai/myTeamOnWhatsApp/refs/heads/main/screenshot1.jpg" alt="Desktop View" width="80%" />
  <br />
  <em>Desktop view – group conversation with AI replies.</em>
</div>

<br />

<div align="center">
  <img src="https://raw.githubusercontent.com/suryasticsai/myTeamOnWhatsApp/refs/heads/main/screenshot2.jpg" alt="Mobile View & Reply Threading" width="45%" />
  <br />
  <em>Mobile responsive view and reply threading.</em>
</div>

---

📁 File Structure

```
.
├── index.html              # Main chat simulation (HTML + CSS + JS)
├── personaManager.html     # Standalone Persona Manager
├── personasoi.png          # Logo
├── screenshot1.jpg         # Desktop screenshot
├── screenshot2.jpg         # Mobile screenshot
└── README.md               # This file
```

---

🔧 Customization

Modify Personas (Chat)

Each team member’s personality is defined in the PERSONAS object inside index.html. You can tweak the vibe, emojiHint, and role fields to change how they reply.

Add your own team knowledge

1. Click the menu (☰) → Load team knowledge (RAGina).
2. Enter the URL of your team’s wiki, Confluence page, or any public documentation.
3. The app will crawl, chunk, and index the content – the AI will then use it to answer questions more accurately.

Customize the Persona Manager

· The RAGina auto‑fill logic is in personaManager.html – you can extend the extraction patterns.
· The CONFIG object at the top of the script allows you to change the repo owner, branch, and file path.

---

🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests for improvements.

---

📄 License

This project is licensed under the MIT License – see the LICENSE file for details.

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/suryasticsai">Sai Surya</a> & the 🦣 team
</div>


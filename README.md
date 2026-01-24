
# Italian Hangman 🇮🇹

A modern, interactive Hangman game designed to help users learn Italian vocabulary. Built with React, Tailwind CSS, and Google Gemini API for high-quality pronunciation.

## ✨ Features

- **Gamified Learning**: Guess words across 3 difficulty levels (Easy, Medium, Hard).
- **Categories**: Learn words contextually (Animals, Food, Colors, Transport, etc.).
- **Smart Hints**: 
  - *Hint 1*: Contextual description.
  - *Hint 2*: Reveal a letter.
- **Audio Pronunciation**: Integration with **Google Gemini TTS** for authentic Italian pronunciation.
- **Multi-language Interface**: Full UI support for **Italian** and **English**.
- **Dark Mode**: Fully supported dark theme for comfortable night learning.
- **Progress Tracking**: Streaks, stars, and level progression saved locally.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API (`@google/genai`) for Text-to-Speech.
- **State**: LocalStorage for persistence.

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/italian-hangman.git
   cd italian-hangman
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory and add your Gemini API Key:
   ```env
   API_KEY=your_google_gemini_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🎮 How to Play

1. Use the physical keyboard or the on-screen virtual keyboard to guess letters.
2. You have 6 attempts ("hearts") to guess the word.
3. Use the "Hint" button if you get stuck.
4. Listen to the pronunciation after winning or losing to improve your Italian skills!

## 📄 License

This project is open-source and available under the MIT License.

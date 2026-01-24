
# Italian Hangman - Project Analysis

## 1. Project Overview
**Italian Hangman** is an interactive web application designed to help children (and beginners) learn Italian vocabulary through a gamified Hangman experience. It combines traditional gameplay with modern web technologies, including Text-to-Speech (TTS) via the Gemini API for pronunciation and multi-language UI support.

## 2. Tech Stack
- **Frontend Framework**: React 18 with TypeScript.
- **Build Tool**: Vite.
- **Styling**: Tailwind CSS (with Dark Mode support).
- **AI Integration**: `@google/genai` (Gemini API) for high-quality audio pronunciation.
- **State Management**: React `useState`, `useRef`, and `localStorage` for persistence.
- **Icons**: SVG icons embedded directly in components.

## 3. Functional Analysis

### 3.1 Core Gameplay (Hangman)
- **Objective**: Guess the hidden Italian word letter by letter within a maximum number of attempts (6).
- **Difficulty Levels**:
  - *Easy*: Basic words (e.g., animals, colors).
  - *Medium*: Slightly longer or more complex concepts.
  - *Hard*: Abstract concepts or longer verbs.
- **Progression**: Players advance levels after completing a set number of words (5 per difficulty tier).
- **Feedback**: Visual feedback (hangman drawing), textual feedback ("Ottimo!", "Peccato!"), and audio cues.

### 3.2 Learning Features
- **Categorization**: Words are grouped by categories (Animals, Food, Colors, etc.) with associated emojis.
- **Dual Language**: Words are stored with their English translation.
- **Audio Pronunciation**:
  - *Italian*: Uses Gemini TTS (`voiceName: 'Kore'`) for authentic pronunciation.
  - *English*: Uses Gemini TTS (`voiceName: 'Puck'`) or browser fallback (`SpeechSynthesisUtterance`).
- **Hint System**:
  - Level 1: Displays a contextual sentence or definition.
  - Level 2: Reveals a random consonant in the hidden word.

### 3.3 UI/UX Design
- **Responsive Design**: Mobile-first approach, fully functional on desktops and tablets.
- **Theme**: Light and Dark mode toggle, persisting user preference.
- **Multi-language UI**: Complete localization of the interface (Menus, Buttons, Feedback) in Italian and English.
- **Gamification Elements**:
  - *Streak Counter*: Tracks consecutive days/sessions played.
  - *Star System*: Awards stars based on performance (3 stars for 0 errors).
  - *Confetti*: Visual celebration on win.

### 3.4 Data Structure
**Word Object**:
```typescript
interface Word {
  italian: string;
  english: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hint?: string;
}
```

**Game State**:
Tracks current word, guesses, remaining attempts, difficulty progress, and user stats (streak, stars).

### 3.5 AI Integration (Gemini Service)
- **Service**: `geminiService.ts`
- **Functionality**: `speakWithGemini(text, language)`
- **Mechanism**:
  1. Checks an in-memory `audioCache` to avoid redundant API calls.
  2. If not cached, sends a request to Gemini `gemini-2.5-flash-preview-tts`.
  3. Decodes raw PCM audio data.
  4. Plays audio via Web Audio API (`AudioContext`).
  5. Fallback to `window.speechSynthesis` if API key is missing or request fails.

## 4. Scalability & Future Improvements
- **Dynamic Content**: Words are currently hardcoded in `constants.ts`. This could be moved to a backend or fetched from a CMS.
- **User Accounts**: Currently uses `localStorage`. Firebase or Supabase integration could allow cross-device sync.
- **New Modes**: Time attack mode or "Spelling Bee" mode using the existing audio infrastructure.

## 5. File Structure
- `App.tsx`: Main game controller and UI layout.
- `types.ts`: TypeScript interfaces.
- `constants.ts`: Game configuration and word database.
- `translations.ts`: UI localization strings.
- `services/geminiService.ts`: Audio handling and API calls.
- `components/`: Reusable UI parts (Keyboard, HangmanVisual, ProgressBar, AdBanner).

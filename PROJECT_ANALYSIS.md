
# Italian Hangman - Project Analysis

## 1. Project Overview
**Italian Hangman** is an interactive web application designed to help children (and beginners) learn Italian vocabulary through a gamified Hangman experience. It combines traditional gameplay with modern web technologies, including Text-to-Speech (TTS) via the Gemini API for pronunciation and multi-language UI support.

## 2. Tech Stack
- **Frontend Framework**: React 18 with TypeScript.
- **Build Tool**: Vite (Standard NPM-based build).
- **Styling**: Tailwind CSS (Standard PostCSS configuration with Dark Mode).
- **AI Integration**: `@google/genai` (Gemini API) for high-quality audio pronunciation.
- **State Management**: React `useState` and `useRef` encapsulated in a **Custom Hook**, with `localStorage` for persistence.
- **Audio**: Web Audio API (`AudioContext`) for Gemini PCM streams and `SpeechSynthesis` for fallbacks.

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
  - *English*: Uses Gemini TTS (`voiceName: 'Puck'`) or browser fallback.
  - *Sequence*: On game end, plays Italian word, waits for a configurable delay (default 2s), then plays English translation.
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

**Config Object**:
```typescript
interface Config {
  words_per_difficulty_level: number;
  max_attempts: number;
  enable_audio: boolean;
  audio_delay_ms: number; // Delay between Italian and English audio
}
```

### 3.5 Architecture & Logic
The application follows a "Separation of Concerns" pattern:
- **View Layer (`App.tsx`)**: Handles UI rendering, layout, themes, and user interactions. It contains almost no business logic.
- **Logic Layer (`hooks/useHangmanGame.ts`)**: A custom React Hook that manages:
  - Game state (current word, guesses, attempts).
  - Rules (win/loss conditions, difficulty progression).
  - Persistence (saving/loading from `localStorage`).
- **Services**:
  - `geminiService.ts`: Handles API calls, audio caching (IndexedDB + Memory), and PCM decoding.
  - `soundEffects.ts`: Generates synthesized sound effects using the Web Audio API (oscillators) without external assets.

## 4. Scalability & Future Improvements
- **Dynamic Content**: Words are currently hardcoded in `constants.ts`. This could be moved to a backend or fetched from a CMS.
- **User Accounts**: Currently uses `localStorage`. Firebase or Supabase integration could allow cross-device sync.
- **New Modes**: Time attack mode or "Spelling Bee" mode using the existing audio infrastructure.

## 5. File Structure
- `index.tsx`: Entry point.
- `App.tsx`: Main UI View component.
- `hooks/useHangmanGame.ts`: Core game logic and state management.
- `types.ts`: TypeScript interfaces.
- `constants.ts`: Game configuration and word database.
- `translations.ts`: UI localization strings.
- `services/geminiService.ts`: Audio handling and AI integration.
- `services/soundEffects.ts`: Synthesized audio effects.
- `components/`: Reusable UI parts (Keyboard, HangmanVisual, ProgressBar, AdBanner).
- `tailwind.config.js`: Tailwind CSS configuration.

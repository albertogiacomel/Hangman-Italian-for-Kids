# Hangman — v1.0.0 (2026-01-25)

Initial stable release of "Hangman — Italian for Kids".

## Overview
Teach Italian vocabulary to children with an interactive Hangman game that presents themed word lists with English translations and difficulty levels. Players guess letters with limited attempts and optional audio cues. Game pace and word selection are adjustable by difficulty.

## Highlights
- Interactive Hangman gameplay with visual feedback and attempt limits
- Themed word lists (e.g., animals, food, colors) with English translations
- Difficulty levels that affect word selection and pacing
- Optional audio cues for correct/incorrect guesses and word pronunciation
- TypeScript codebase with a lightweight, accessible UI
- Basic build and distribution support (TypeScript -> JavaScript)

## What's included
- All core gameplay logic (word selection, guess handling, scoring)
- Theme and word-list loading facilities
- UI components (responsive HTML + TypeScript)
- Optional audio integration points
- README with setup and run instructions

## Breaking changes / Notes
- This is the first stable release — no prior releases exist
- Default release targets the `main` branch

## How to install / run (dev)
1. Clone the repo:
   git clone https://github.com/albertogiacomel/Hangman-Italian-for-Kids.git
2. Install dependencies:
   npm install
3. Run dev server / build:
   npm run dev            # if available
   npm run build          # produces build artifacts in the configured output dir

## How to use (end users)
- Open the site (local dev server or deployed URL).
- Pick a theme and difficulty.
- Guess letters until the word is solved or attempts run out.
- Toggle audio in settings if available.

## How to add/review words
- Word lists are stored under the project’s words/themes directory (see README).
- Add words with their English translation and difficulty marker.

## Credits
Author: albertogiacomel
License: See repository LICENSE file

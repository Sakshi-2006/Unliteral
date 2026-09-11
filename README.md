# UNLITERAL

## Translate the culture, not just the words.

UNLITERAL is an AI-powered cultural translation platform for storytellers. It focuses on adapting dialogue beyond literal translation by preserving cultural context, slang, humour, subtext, and character intent.

The project is built for the **Agentic Cinema: The Blockbuster Hackathon — Lights. Camera. Code.**

## Problem

Literal translation often changes the meaning and personality of dialogue. Slang, cultural references, humour, and contextual expressions may lose their intended meaning when translated word-for-word.

UNLITERAL helps storytellers adapt content so that translated dialogue feels natural and culturally appropriate for its target audience.

## Key Features

### Cultural Translation

* AI-powered translation using Google Gemini
* Context-aware dialogue adaptation
* Preserves the intent and meaning of dialogue rather than translating word-for-word
* Handles slang, humour, cultural references, and subtext
* Generates Natural-Sounding translated dialogue

### Audio and Video Processing

* Upload and process supported audio and video files
* Generate transcripts from uploaded media
* Translate media content using the AI translation pipeline
* Audio and video workflows are handled separately according to their supported formats

### Language Support

* Source and target language selection
* Support for multiple languages through the translation system
* Language-aware translation and cultural adaptation

### AI Translation Pipeline

UNLITERAL uses Google Gemini to:

1. Understand the original dialogue
2. Identify context and intent
3. Interpret cultural meaning
4. Adapt expressions for the target audience
5. Generate natural translated dialogue

### Project Workspace

* Studio-based interface for working with translation projects
* Media upload workflow
* Transcript generation
* Translation workflow
* Project-oriented workspace for storytellers

## Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Lucide React

### AI

* Google Gemini
* Google GenAI SDK

### Search

* Parallel Search API

### Deployment

* Vercel

### Development

* Git
* GitHub
* Visual Studio Code

## Architecture

```text
User
  |
  v
UNLITERAL Studio
  |
  +------------------+
  |                  |
  v                  v
Audio / Video       Text
  |                  |
  +--------+---------+
           |
           v
     Gemini AI
           |
           v
Context & Intent Understanding
           |
           v
Cultural Adaptation
           |
           v
Natural Translation
           |
           v
Translated Dialogue
```

## Project Structure

```text
UNLITERAL/
├── app/
│   ├── api/
│   ├── auth/
│   ├── page.tsx
│   └── layout.tsx
├── components/
├── lib/
│   ├── gemini.ts
│   ├── localizationEngine.ts
│   ├── mediaProviders.ts
│   ├── mediaValidation.ts
│   ├── parallel.ts
│   └── transcriptionProviders.ts
├── agent/
├── public/
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

* Node.js
* npm or pnpm
* Google Gemini API access
* Parallel API access

### Installation

Clone the repository:

```bash
git clone https://github.com/Sakshi-2006/Unliteral.git
cd Unliteral
```

Install dependencies:

```bash
npm install
```

Create a `.env` file and add the required API credentials:

```env
GEMINI_API_KEY=your_gemini_api_key
PARALLEL_API_KEY=your_parallel_api_key
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Team

### Team Members

* Sakshi Karwade
* Shubhi Jain
* Dhiraj Kumar
* Shristy Singh

## Hackathon

UNLITERAL was developed for:

**Agentic Cinema: The Blockbuster Hackathon — Lights. Camera. Code.**

The project explores how AI can help storytellers adapt dialogue across languages and cultures while retaining the original meaning, intent, and character voice.

## License

This project is open source and available under the MIT License.

# ConfigGuardian Client

A clean, modern React UI for ConfigGuardian - AI-powered configuration security analysis.

## Features

- **Multimodal Input**: Support for both text and image uploads
- **Real-time Analysis**: Live polling for task status updates
- **Interactive Findings**: Click to highlight code sections
- **One-click Autofix**: Generate and review security fixes
- **Comprehensive Reports**: Markdown-based security reports
- **Dark Mode**: Built-in dark mode support
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Router** for navigation
- **Lucide React** for icons
- **React Markdown** for report rendering
- **React Diff Viewer** for code diffs

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## Backend Integration

The client is configured to proxy API requests to the backend running on `http://localhost:4000`. Make sure your ConfigGuardian backend is running before using the client.

## Project Structure

```
src/
├── app/           # App configuration and routing
├── components/    # Reusable UI components
├── pages/         # Page components
├── lib/           # Utilities, types, and API client
└── index.css      # Global styles
```

## Key Components

- **Home**: Landing page with input forms
- **Task**: Analysis results and findings viewer
- **Report**: Generated security reports
- **DiffDrawer**: Modal for reviewing autofix changes
- **ToastContainer**: Global notification system

## API Endpoints

The client communicates with the backend through these endpoints:

- `POST /api/task` - Create new analysis task
- `GET /api/task/:id` - Get task status and results
- `POST /api/analyze/:id` - Trigger analysis
- `POST /api/autofix/:id` - Generate autofix
- `POST /api/report/:id` - Generate security report
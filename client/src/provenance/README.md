# Provenance Module

A React + Tailwind UI module for ConfigGuardian that provides hash, agent, and verification functionality.

## Usage

Go to `/provenance` → enter taskId → Build Envelope → Verify Locally

## Features

- **Build Envelope**: Enter a task ID and call `POST /api/provenance/:id` to generate an envelope
- **View Envelope**: Display hash, createdAt, payload summary, and publishHint
- **Copy Functionality**: Copy hash, agent address, and envelope JSON
- **QR Code**: Generate QR code of publishHint (agent address or URL)
- **Local Verification**: Send envelope back to `POST /api/provenance/verify` for verification
- **Results Display**: Show verification results with success/fail status

## API Endpoints

- `POST /api/provenance/:id` - Build envelope from task ID
- `POST /api/provenance/verify` - Verify envelope locally

## Environment Variables

- `VITE_AGENTVERSE_BASE` - Base URL for Agentverse (optional, defaults to `https://agentverse.ai/agents/`)

## Components

- `ProvenancePage.tsx` - Main component with full UI
- `types.ts` - TypeScript type definitions
- `api.ts` - API client functions
- `utils.ts` - Utility functions

## Dependencies

- `react-hot-toast` - Toast notifications
- `qrcode.react` - QR code generation
- `lucide-react` - Icons (Copy, Check, Shield, Link, ExternalLink, ArrowLeft)

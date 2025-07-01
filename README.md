# Soldex Backend

This is the backend for the Soldex decentralized exchange platform, built with Node.js, Express, and TypeScript.

## Features
- REST API for pool, token, and user management
- MongoDB integration
- WebSocket support
- Solana blockchain integration

## Prerequisites
- Node.js (v18 or higher recommended)
- Yarn (recommended) or npm
- MongoDB instance (local or remote)

## Installation

Clone the repository and install dependencies:

```bash
yarn install
# or
npm install
```

## Environment Variables

Create a `.env` file in the root directory and configure the required environment variables (see `src/config` for details).

## Running the Development Server

```bash
yarn start
# or
npm run start
```

The backend will start (default port is set in your config, e.g., 3000 or 4000).

## Building for Production

```bash
yarn build
# or
npm run build
```

## Running Tests

```bash
yarn test
# or
npm run test
``` 
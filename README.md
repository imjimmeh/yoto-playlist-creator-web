# Yoto Playlist Creator Web

A web application for creating and managing Yoto player playlists, with a focus on advanced features like AI-powered icon generation and asynchronous job processing.

## Features

- **Playlist Management:** Create, edit, and delete Yoto playlists.
- **Track Management:** Add audio tracks to your playlists from your local computer.
- **AI Icon Generation:** Automatically generate icons for your playlist tracks using any OpenAI-compatible API. This includes services like OpenAI, OpenRouter (which offers free models), or a self-hosted solution like Ollama.
- **Custom Icons:** Upload and manage your own library of custom icons to use for your tracks.
- **Job Queue:** File uploads and icon generation are handled in the background, so you can continue using the application while these long-running tasks complete. The job queue page allows you to monitor the status of your jobs.
- **Random Playlist:** Discover new content by creating a playlist with a random selection of tracks from your library.
- **Settings:** Configure your AI service endpoint and API key, and manage other application settings.
- **Help Page:** A comprehensive guide to all the features of the application.

## How it Works

The application is a single-page application (SPA) built with React. It interacts with the Yoto API to manage your playlists and content. Here's a brief overview of the workflow:

1.  **Authentication:** The application uses OAuth2 to securely connect to your Yoto account.
2.  **Playlist Creation:** You can create a new playlist by providing a title and adding audio files. The application will upload the files to the Yoto servers and add them to the playlist.
3.  **Icon Generation:** If you enable AI icon generation, the application will send a request to your configured AI service for each track to generate a unique icon.
4.  **Job Queue:** All long-running tasks, such as file uploads and icon generation, are added to a job queue. This ensures that the application remains responsive and you can track the progress of your jobs.

## Architecture

- **Frontend:** React, Vite, TypeScript
- **Styling:** CSS with a custom design system
- **Routing:** `react-router-dom`
- **State Management:** React Context API
- **API Client:** A custom `YotoHttpClient` for interacting with the Yoto API
- **Local Storage:** IndexedDB (via the `idb` library) for persisting the job queue

## Development

### Prerequisites

- Node.js (version specified in `package.json`)
- npm or yarn package manager

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Production build for static deployment
npm run build:static

# Lint code
npm run lint

# Preview production build
npm run preview

# Serve production build
npm run serve

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Development Server

The development server runs on port 3000 by default with hot module replacement:

```bash
npm run dev
```

### Production Build

To build for production:

```bash
npm run build
```

The output will be in the `dist/` directory.

## Testing

This project uses Jest and React Testing Library for testing. See [Testing README](src/__tests__/README.md) for more information.

## Deployment

The application can be deployed as a static website. The build process generates all necessary assets in the `dist/` directory.

For deployment:
1. Run `npm run build:static`
2. Deploy the contents of the `dist/` directory to your web server
3. Configure your web server to serve `index.html` for all routes (client-side routing)
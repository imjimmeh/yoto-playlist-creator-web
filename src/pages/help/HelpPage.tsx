import React from "react";
import "./HelpPage.css";

const HelpPage: React.FC = () => {
  return (
    <div className="help-page">
      <h1>Help</h1>

      <section>
        <h2>App Functionality</h2>
        <p>
          This application allows you to create and manage Yoto playlists. You
          can add tracks, reorder them, and set a custom icon for each track.
        </p>
        <h3>AI Icon Picking</h3>
        <p>
          One of the key features of this app is the ability to have an AI pick
          the icons icons for your playlist tracks. When you create or edit a
          playlist, if you have configured the AI settings on the settings page
          then the AI will automatically pick the icons for you! The app will
          send a request to an AI service with the track title and a prompt to
          generate an icon. The generated icon will then be displayed next to
          the track.
        </p>
      </section>

      <section>
        <h2>Getting an OpenAI Compatible API Key</h2>
        <p>
          To use the AI icon generation feature, you need an API key from an
          OpenAI compatible service. Here are a few options:
        </p>
        <ul>
          <li>
            <strong>OpenAI:</strong> You can get an API key directly from{" "}
            <a
              href="https://www.openai.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              OpenAI
            </a>
            . You will need to create an account and add a payment method.
          </li>
          <li>
            <strong>OpenRouter:</strong>{" "}
            <a
              href="https://openrouter.ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              OpenRouter
            </a>{" "}
            is a service that gives you access to a variety of AI models,
            including some free ones. You can get an API key from them and use
            it in this app. OpenRouter offers a certain number of free requests
            daily.
          </li>
          <li>
            <strong>Self-hosted (Ollama):</strong> If you prefer to run your own
            AI model locally, you can use a tool like{" "}
            <a
              href="https://ollama.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ollama
            </a>
            . Ollama allows you to run powerful open-source models on your own
            computer. You would then use your computer's IP address and port as
            the API endpoint in this app's settings.
          </li>
        </ul>
      </section>

      <section>
        <h2>Random Playlist Feature</h2>
        <p>
          On the homepage, you'll find a "Random Playlist" button. This feature
          is a quick way to discover new content. When you click it, the app
          will create a new playlist with a random selection of tracks from your
          library.
        </p>
      </section>
    </div>
  );
};

export default HelpPage;

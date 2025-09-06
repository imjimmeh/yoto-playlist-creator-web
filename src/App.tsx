import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";
import Navbar from "./components/Navbar";
import ProtectedLayout from "./components/ProtectedLayout";
import SettingsPage from "./pages/settings/SettingsPage";
import PlaylistsPage from "./pages/playlists/PlaylistsPage";
import PlaylistManagerPage from "./pages/playlistManager/PlaylistManagerPage";
import JobQueuePage from "./pages/jobQueue/JobQueuePage";
import LoginPage from "./pages/login/LoginPage";
import CustomIconsPage from "./pages/customIcons/CustomIconsPage";
import HelpPage from "./pages/help/HelpPage";
import CreationStatusToast from "./components/CreationStatusToast";
import { useJobQueueStore } from "./hooks/useJobQueueStore"; // Corrected import
import { AppProvider } from "./contexts/AppProvider";

const AppContent: React.FC = () => {
  const queueStatus = useJobQueueStore();
  const [dismissedToast, setDismissedToast] = useState(false);

  const handleDismissToast = () => {
    setDismissedToast(true);
  };

  useEffect(() => {
    if (queueStatus && (queueStatus.isProcessing || queueStatus.queueLength > 0)) {
      setDismissedToast(false);
    }
  }, [queueStatus]);

  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<LoginPage />} />
          
          {/* All protected routes are now nested here */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<PlaylistsPage />} />
            <Route path="/playlist/create" element={<PlaylistManagerPage />} />
            <Route path="/playlists/:playlistId" element={<PlaylistManagerPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/job-queue" element={<JobQueuePage />} />
            <Route path="/custom-icons" element={<CustomIconsPage />} />
            <Route path="/help" element={<HelpPage />} />
          </Route>
        </Routes>
      </main>
      <Toaster />
      {!dismissedToast && queueStatus &&
        (queueStatus.isProcessing ||
          queueStatus.queueLength > 0 ||
          queueStatus.currentJob) && (
          <CreationStatusToast
            queueStatus={queueStatus}
            onDismiss={handleDismissToast}
          />
        )}
        {/* Debug: Show current queue status */}
        
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Router>
  );
};

export default App;
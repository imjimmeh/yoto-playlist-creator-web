import React, { useState, useEffect, useMemo } from "react";
import { type CustomIcon } from "@/services/CustomIconService";
import { useError } from "@/contexts/ErrorContext";
import PageHero from "../../components/PageHero";
import LoadingButton from "../../components/LoadingButton";
import Alert from "../../components/Alert";
import CustomIconCard from "../../components/CustomIconCard";
import "./CustomIconsPage.css";
import { useServices } from "@/contexts/useServices";

const CustomIconsPage: React.FC = () => {
  const [icons, setIcons] = useState<CustomIcon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingIcon, setEditingIcon] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTags, setEditTags] = useState("");
  const [sortCriteria, setSortCriteria] = useState<"newest" | "oldest" | "name">("newest");
  const { showError } = useError();
  const { customIconService, isReady } = useServices();

  // Memoized sorted icons
  const sortedIcons = useMemo(() => {
    const sorted = [...icons];
    switch (sortCriteria) {
      case "newest":
        // Icons are already sorted by newest first from the service
        return sorted;
      case "oldest":
        return sorted.sort((a, b) => 
          new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
        );
      case "name":
        return sorted.sort((a, b) => 
          a.title.localeCompare(b.title)
        );
      default:
        return sorted;
    }
  }, [icons, sortCriteria]);

  useEffect(() => {
    if (isReady) {
      loadIcons();
    }
  }, [isReady]);

  const loadIcons = async () => {
    setIsLoading(true);
    try {
      const customIcons = await customIconService.getCustomIcons();
      setIcons(customIcons);
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Failed to load custom icons"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      await customIconService.uploadCustomIcon(file);
      await loadIcons();
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Failed to upload icon"
      );
    } finally {
      setIsLoading(false);
      // Reset the file input to allow uploading the same file again
      event.target.value = "";
    }
  };

  const triggerFileUpload = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.multiple = false;
    
    fileInput.onchange = (event) => {
      handleFileSelect(event as unknown as React.ChangeEvent<HTMLInputElement>);
    };

    fileInput.click();
  };

  const startEdit = (icon: CustomIcon) => {
    setEditingIcon(icon.id);
    setEditTitle(icon.title);
    setEditTags(icon.tags ? icon.tags.join(", ") : "");
  };

  const saveEdit = async (icon: CustomIcon) => {
    try {
      const tagsArray = editTags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const updatedIcon = await customIconService.updateCustomIcon(
        icon,
        {
          title: editTitle.trim(),
          tags: tagsArray,
        }
      );

      if (updatedIcon) {
        await loadIcons();
        cancelEdit();
      } else {
        showError("Failed to update icon");
      }
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Failed to update icon"
      );
    }
  };

  const cancelEdit = () => {
    setEditingIcon(null);
    setEditTitle("");
    setEditTags("");
  };

  return (
    <div className="custom-icons-page">
      <PageHero
        title="Custom Icons"
        description="Upload and manage your own custom icons for playlist chapters"
      >
        <div className="hero-inner">
          <div className="hero-actions">
            <LoadingButton
              variant="primary"
              onClick={triggerFileUpload}
              loading={isLoading}
              loadingChildren="Uploading..."
            >
              <span className="btn-icon">📁</span>
              Upload Icon
            </LoadingButton>
          </div>
          <div>
            <h5>
              For additional icons, try awesome sites such as{" "}
              <a href="https://www.yotoicons.com/" target="_blank" rel="noopener noreferrer">
                Yotoicons
              </a>
              !
            </h5>
          </div>
        </div>
      </PageHero>
      <div className="parent-info">
        <div className="info-section">
          <Alert type="info">
            <strong>Tips for Custom Icons:</strong>
            <ul>
              <li>Square images work best (1:1 aspect ratio)</li>
              <li>High contrast images are easier to see on Yoto cards</li>
              <li>
                Simple, recognizable shapes work better than detailed images
              </li>
            </ul>
          </Alert>
        </div>
      </div>
      {icons.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎨</div>
          <h3>No Custom Icons Yet</h3>
          <p>Upload your first custom icon to get started!</p>
          <p className="empty-subtitle">
            Supported formats: PNG, JPG, GIF • Max size: 5MB
          </p>
        </div>
      ) : (
        <div className="icons-section">
          <div className="section-header">
            <div className="section-header-content">
              <h2>Your Custom Icons ({icons.length})</h2>
              <div className="sort-controls">
                <label htmlFor="sort-icons">Sort by:</label>
                <select 
                  id="sort-icons"
                  value={sortCriteria}
                  onChange={(e) => setSortCriteria(e.target.value as "newest" | "oldest" | "name")}
                  className="sort-dropdown"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="icons-grid">
            {sortedIcons.map((icon) => (
              <CustomIconCard
                key={icon.id}
                icon={icon}
                isEditing={editingIcon === icon.id}
                editTitle={editTitle}
                editTags={editTags}
                onEditStart={startEdit}
                onEditSave={saveEdit}
                onEditCancel={cancelEdit}
                onTitleChange={setEditTitle}
                onTagsChange={setEditTags}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomIconsPage;

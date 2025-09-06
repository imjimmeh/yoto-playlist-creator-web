import React from "react";
import "./LoadingButton.css";

export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface LoadingButtonProps {
  children: React.ReactNode;
  loadingChildren?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  onClick?: () => Promise<void> | PromiseLike<void> | void;
  type?: "button" | "submit" | "reset";
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  children,
  loadingChildren,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  type = "button",
}) => {
  const getButtonClasses = () => {
    const classes = ["loading-btn", `btn-${variant}`, `btn-${size}`, className];
    if (loading) classes.push("btn-loading");
    return classes.filter(Boolean).join(" ");
  };

  return (
    <button
      type={type}
      className={getButtonClasses()}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <span className="spinner"></span>}
      <span className="btn-content">
        {loading && loadingChildren ? loadingChildren : children}
      </span>
    </button>
  );
};

export default LoadingButton;

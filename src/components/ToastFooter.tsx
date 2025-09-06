import React from "react";

interface ToastFooterProps {
  queueLength: number;
}

const ToastFooter: React.FC<ToastFooterProps> = ({ queueLength }) => {
  return (
    <div className="toast-footer">
      <p className="info-text">
        {queueLength > 0
          ? "This job is complete. Remaining jobs will process automatically."
          : "Upload complete! You can now close this notification."}
      </p>
    </div>
  );
};

export default ToastFooter;
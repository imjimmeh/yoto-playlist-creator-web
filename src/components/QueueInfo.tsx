import React from "react";

interface QueueInfoProps {
  queueLength: number;
}

const QueueInfo: React.FC<QueueInfoProps> = ({ queueLength }) => {
  return (
    <div className="queue-info">
      <p>
        {queueLength} other playlist{queueLength > 1 ? "s" : ""} in
        queue.
      </p>
    </div>
  );
};

export default QueueInfo;
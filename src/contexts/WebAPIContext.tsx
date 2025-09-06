import React, { type ReactNode } from "react";
import { createWebAPI } from "../utils/web-api";
import { WebAPIContext } from "./WebAPIContext";

export const WebAPIProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const webAPI = createWebAPI();

  return (
    <WebAPIContext.Provider value={webAPI}>{children}</WebAPIContext.Provider>
  );
};

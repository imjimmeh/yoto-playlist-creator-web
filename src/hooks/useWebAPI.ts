import { useContext } from "react";
import { WebAPIContext } from "../contexts/WebAPIContext";
import type { WebAPI } from "../utils/web-api";

export const useWebAPI = (): WebAPI => {
  const context = useContext(WebAPIContext);
  if (!context) {
    throw new Error("useWebAPI must be used within a WebAPIProvider");
  }
  return context;
};

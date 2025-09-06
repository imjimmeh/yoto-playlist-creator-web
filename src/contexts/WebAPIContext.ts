import { createContext } from "react";
import type { WebAPI } from "../utils/web-api";

export const WebAPIContext = createContext<WebAPI | null>(null);

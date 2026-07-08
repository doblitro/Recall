import { ConnectorProvider } from "../types";
import { gmailProvider } from "./gmail";
import { googleDriveProvider } from "./google-drive";

export const providersArray: ConnectorProvider[] = [
  googleDriveProvider,
  gmailProvider,
];

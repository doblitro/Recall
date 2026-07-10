export const GOOGLE_DRIVE_PROVIDER_ID = "google_drive";
export const GMAIL_PROVIDER_ID = "gmail";

export const CONNECTOR_LIST = [
  {
    id: GOOGLE_DRIVE_PROVIDER_ID,
    label: "Google Drive",
    image: "/socials/drive.svg",
  },
  { id: GMAIL_PROVIDER_ID, label: "Gmail", image: "/socials/gmail.svg" },
] as const;

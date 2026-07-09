"use client";

import Table, { Column } from "../ui/Table";
import { GMAIL_PROVIDER_ID } from "@/lib/connectors/public";
import useConnectorSearch from "@/app/hooks/useConnectorSearch";
import { GmailAttachment } from "@/lib/connectors/types";

export type GmailMessage = {
  id?: string | null;
  snippet?: string | null;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  accountEmail?: string;
  attachments?: { filename: string; mimeType?: string }[];
};

const columns: Column<GmailMessage>[] = [
  {
    header: "Origin",
    render: (message) => message.accountEmail || "Unknown",
  },
  {
    header: "Subject",
    render: (message) => (
      <div
        dangerouslySetInnerHTML={{ __html: message.subject || "(no subject)" }}
      />
    ),
  },
  {
    header: "From",
    render: (message) => (
      <div dangerouslySetInnerHTML={{ __html: message.from ?? "" }} />
    ),
  },
  {
    header: "To",
    render: (message) => (
      <div dangerouslySetInnerHTML={{ __html: message.to ?? "" }} />
    ),
  },
  {
    header: "Snippet",
    render: (message) => (
      <div dangerouslySetInnerHTML={{ __html: message.snippet ?? "" }} />
    ),
  },
  {
    header: "Attachments",
    render: (message) =>
      message.attachments?.length ? (
        <>
          {message.attachments.map((a: GmailAttachment, index: number) => (
            <span key={index}>
              {index > 0 && ", "}
              <span dangerouslySetInnerHTML={{ __html: a.filename }} />
            </span>
          ))}
        </>
      ) : undefined,
  },
  {
    header: "Date",
    render: (message) => message.date,
  },
];

const GmailMessages = ({ searchKeyword }: { searchKeyword: string }) => {
  const messages = useConnectorSearch<GmailMessage>(
    `/api/connectors/${GMAIL_PROVIDER_ID}/messages`,
    "messages",
    searchKeyword,
  );

  return (
    <div className="flex flex-col gap-4">
      <Table items={messages} columns={columns} />
    </div>
  );
};

export default GmailMessages;

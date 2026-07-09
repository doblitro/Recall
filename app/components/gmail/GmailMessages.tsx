"use client";

import { useState } from "react";
import Table, { Column } from "../ui/Table";
import { GMAIL_PROVIDER_ID } from "@/lib/connectors/public";
import useConnectorSearch from "@/app/hooks/useConnectorSearch";
import useConnectorDetail from "@/app/hooks/useConnectorDetail";
import { GmailListItem, GmailDetailItem } from "@/lib/connectors/types";

const columns: Column<GmailListItem>[] = [
  {
    header: "Origin",
    render: (message) => message.accountEmail || "Unknown",
  },
  {
    header: "Subject",
    render: (message) =>
      message.url ? (
        <a href={message.url} target="_blank" rel="noopener noreferrer">
          <span dangerouslySetInnerHTML={{ __html: message.title }} />
        </a>
      ) : (
        <span dangerouslySetInnerHTML={{ __html: message.title }} />
      ),
  },
  {
    header: "From",
    render: (message) => (
      <div dangerouslySetInnerHTML={{ __html: message.subtitle ?? "" }} />
    ),
  },
  {
    header: "Snippet",
    render: (message) => (
      <div dangerouslySetInnerHTML={{ __html: message.preview ?? "" }} />
    ),
  },
  {
    header: "Date",
    render: (message) => message.updatedAt,
  },
];

const MessageDetail = ({
  detail,
  loading,
  error,
}: {
  detail: GmailDetailItem | null;
  loading: boolean;
  error: string | null;
}) => {
  if (loading) return <div className="py-2 text-sm">Loading…</div>;
  if (error) return <div className="py-2 text-sm text-red-600">{error}</div>;
  if (!detail) return null;

  const { metadata } = detail;

  return (
    <div className="flex flex-col gap-2 py-2 text-sm">
      {metadata.toDisplay && (
        <div>
          <strong>To:</strong>{" "}
          <span dangerouslySetInnerHTML={{ __html: metadata.toDisplay }} />
        </div>
      )}
      {metadata.ccDisplay && (
        <div>
          <strong>Cc:</strong>{" "}
          <span dangerouslySetInnerHTML={{ __html: metadata.ccDisplay }} />
        </div>
      )}
      {metadata.bccDisplay && (
        <div>
          <strong>Bcc:</strong>{" "}
          <span dangerouslySetInnerHTML={{ __html: metadata.bccDisplay }} />
        </div>
      )}
      {metadata.replyToDisplay && (
        <div>
          <strong>Reply-To:</strong>{" "}
          <span dangerouslySetInnerHTML={{ __html: metadata.replyToDisplay }} />
        </div>
      )}
      {metadata.messageId && (
        <div>
          <strong>Message-ID:</strong> {metadata.messageId}
        </div>
      )}
      {metadata.attachments.length > 0 && (
        <div>
          <strong>Attachments:</strong>{" "}
          {metadata.attachments.map((a, index) => (
            <span key={index}>
              {index > 0 && ", "}
              <span dangerouslySetInnerHTML={{ __html: a.filename }} />
            </span>
          ))}
        </div>
      )}
      <div>
        <strong>Body:</strong>
        <div
          className="max-h-96 overflow-y-auto whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: metadata.bodyHtml }}
        />
      </div>
    </div>
  );
};

const GmailMessages = ({ searchKeyword }: { searchKeyword: string }) => {
  const messages = useConnectorSearch<GmailListItem>(
    `/api/connectors/${GMAIL_PROVIDER_ID}/messages`,
    "messages",
    searchKeyword,
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const {
    data: detail,
    loading,
    error,
    fetchDetail,
    reset,
  } = useConnectorDetail<GmailDetailItem>("message");

  const handleRowClick = (message: GmailListItem) => {
    if (expandedId === message.id) {
      setExpandedId(null);
      reset();
      return;
    }

    setExpandedId(message.id ?? null);
    fetchDetail(`/api/connectors/${GMAIL_PROVIDER_ID}/messages/${message.id}`, {
      integrationId: message.integrationId,
      keyword: searchKeyword,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Table
        items={messages}
        columns={columns}
        isRowExpanded={(message) => message.id === expandedId}
        onRowClick={handleRowClick}
        renderDetail={(message) =>
          message.id === expandedId ? (
            <MessageDetail detail={detail} loading={loading} error={error} />
          ) : null
        }
      />
    </div>
  );
};

export default GmailMessages;

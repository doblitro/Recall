"use client";

import { useEffect, useState } from "react";
import ResultCard from "../ui/ResultCard";
import { GMAIL_PROVIDER_ID } from "@/lib/connectors/public";
import useConnectorSearch from "@/app/hooks/useConnectorSearch";
import useConnectorDetail from "@/app/hooks/useConnectorDetail";
import { GmailListItem, GmailDetailItem } from "@/lib/connectors/types";
import Link from "../ui/Link";

const renderTitle = (message: GmailListItem) =>
  message.url ? (
    <Link href={message.url} target="_blank" rel="noopener noreferrer" showIcon>
      <span dangerouslySetInnerHTML={{ __html: message.title }} />
    </Link>
  ) : (
    <span dangerouslySetInnerHTML={{ __html: message.title }} />
  );

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
  if (error) return <div className="py-2 text-sm text-danger">{error}</div>;
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

const GmailMessages = ({
  searchKeyword,
  onCountChange,
}: {
  searchKeyword: string;
  onCountChange?: (count: number, isFetching: boolean) => void;
}) => {
  const { data: messages, isFetching } = useConnectorSearch<GmailListItem>(
    `/api/connectors/${GMAIL_PROVIDER_ID}/messages`,
    "messages",
    searchKeyword,
  );

  useEffect(() => {
    onCountChange?.(messages.length, isFetching);
  }, [messages.length, isFetching, onCountChange]);

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
      {messages.map((message) => (
        <ResultCard
          key={message.id}
          provider={GMAIL_PROVIDER_ID}
          title={renderTitle(message)}
          subtitle={
            <div
              dangerouslySetInnerHTML={{ __html: message.subtitle ?? "" }}
            />
          }
          preview={
            <div dangerouslySetInnerHTML={{ __html: message.preview ?? "" }} />
          }
          date={message.updatedAt}
          footer={message.accountEmail || "Unknown"}
          expanded={message.id === expandedId}
          onClick={() => handleRowClick(message)}
          renderDetail={() =>
            message.id === expandedId ? (
              <MessageDetail detail={detail} loading={loading} error={error} />
            ) : null
          }
        />
      ))}
    </div>
  );
};

export default GmailMessages;

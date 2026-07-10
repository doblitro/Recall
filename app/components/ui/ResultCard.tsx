import Image from "next/image";
import { CONNECTOR_LIST } from "@/lib/connectors/public";

const ResultCard = ({
  provider,
  title,
  subtitle,
  preview,
  date,
  footer,
  expanded,
  onClick,
  renderDetail,
}: {
  provider: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  preview?: React.ReactNode;
  date?: string;
  footer?: React.ReactNode;
  expanded: boolean;
  onClick?: () => void;
  renderDetail?: () => React.ReactNode;
}) => {
  const connector = CONNECTOR_LIST.find((c) => c.id === provider);

  return (
    <div
      className={`flex flex-col gap-2 border-2 border-b border-border shadow-input last:border-b-0 px-4 py-3 rounded-xl ${
        onClick ? "cursor-pointer hover:bg-surface-hover" : ""
      } ${expanded ? "bg-surface-hover" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 flex items-center justify-center rounded-full bg-surface size-9 overflow-hidden">
          {connector && (
            <Image
              src={connector.image}
              alt={connector.label}
              width={20}
              height={20}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="font-semibold truncate">{title}</div>
            {date && (
              <div className="shrink-0 text-xs text-muted-foreground">
                {date}
              </div>
            )}
          </div>
          {subtitle && (
            <div className="text-sm text-muted-foreground truncate">
              {subtitle}
            </div>
          )}
          {preview && <div className="text-sm mt-1">{preview}</div>}
          {footer && (
            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              {footer}
            </div>
          )}
        </div>
      </div>
      {expanded && renderDetail && (
        <div className="pl-12">{renderDetail()}</div>
      )}
    </div>
  );
};

export default ResultCard;

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
      className={`border-border shadow-input flex flex-col gap-2 rounded-xl border-2 border-b px-4 py-3 last:border-b-0 ${
        onClick ? "hover:bg-surface-hover cursor-pointer" : ""
      } ${expanded ? "bg-surface-hover" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="bg-surface flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
          {connector && (
            <Image
              src={connector.image}
              alt={connector.label}
              width={20}
              height={20}
              draggable={false}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="truncate font-semibold">{title}</div>
            {date && (
              <div className="text-muted-foreground shrink-0 text-xs">
                {date}
              </div>
            )}
          </div>
          {subtitle && (
            <div className="text-muted-foreground truncate text-sm">
              {subtitle}
            </div>
          )}
          {preview && <div className="mt-1 text-sm">{preview}</div>}
          {footer && (
            <div className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
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

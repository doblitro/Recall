import Image from "next/image";

type BrandTypefaceProps = {
  showDescription?: boolean;
  compact?: boolean;
};

export function BrandTypeface({
  showDescription = false,
  compact = false,
}: BrandTypefaceProps) {
  return (
    <div className={`flex gap-2 ${compact ? "items-center" : "flex-col"}`}>
      <Image
        src="/icon.svg"
        alt="Recall icon"
        height={compact ? 26 : 40}
        width={compact ? 26 : 40}
        draggable={false}
        className="shrink-0"
      />

      <h1
        className={`m-0 font-semibold tracking-tight ${compact ? "text-2xl" : "text-4xl"}`}
      >
        Recall
      </h1>

      {showDescription && (
        <p className="text-muted-foreground max-w-sm text-base leading-7">
          Instant search across your entire workspace.
        </p>
      )}
    </div>
  );
}

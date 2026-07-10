type BrandTypefaceProps = {
  showDescription?: boolean;
};

export function BrandTypeface({ showDescription = false }: BrandTypefaceProps) {
  return (
    <div className="space-y-3">
      <h1 className="text-4xl font-semibold tracking-tight">Recall</h1>

      {showDescription && (
        <p className="text-muted-foreground max-w-sm text-base leading-7">
          Instant search across your entire workspace.
        </p>
      )}
    </div>
  );
}

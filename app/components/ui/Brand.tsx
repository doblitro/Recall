export const BrandTypeface = ({
  showDescription,
}: {
  showDescription?: boolean;
}) => {
  return (
    <div>
      <h1 className="text-foreground text-4xl font-bold">Recall</h1>
      {showDescription && (
        <p className="text-muted-foreground text-sm">
          Instant search across your entire workspace.
        </p>
      )}
    </div>
  );
};

import { Loader } from "lucide-react";
import { ProviderFilter } from "@/app/providers/SearchFilterProvider";
import { CONNECTOR_LIST } from "@/lib/connectors/public";
import { Connector } from "@/lib/connectors/types";

const FilterButton = ({
  label,
  count,
  loading,
  onClick,
  isActive,
}: {
  label: string;
  count?: number;
  loading?: boolean;
  onClick: () => any;
  isActive: boolean;
}) => {
  const activeButton = "border-2 border-input shadow-input";

  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded text-foreground flex items-center hover:cursor-pointer ${isActive && activeButton}`}
    >
      {label}
      {loading ? (
        <Loader
          className="text-sm ml-1 inline size-3 animate-spin text-muted-foreground"
          aria-label="Loading"
          role="status"
        />
      ) : (
        count !== undefined && <span className="text-xs mx-2">{count}</span>
      )}
    </button>
  );
};

const FilterRow = ({
  activeProvider,
  setActiveProvider,
  counts,
  isSearching,
  loadingByProvider,
}: {
  activeProvider: ProviderFilter;
  setActiveProvider: (id: ProviderFilter) => void;
  counts?: Partial<Record<string, number>>;
  isSearching?: boolean;
  loadingByProvider?: Partial<Record<string, boolean>>;
}) => {
  const total = counts
    ? CONNECTOR_LIST.reduce((sum, c) => sum + (counts[c.id] ?? 0), 0)
    : undefined;

  const anyLoading =
    isSearching || CONNECTOR_LIST.some((c) => loadingByProvider?.[c.id]);

  return (
    <div className="flex items-center gap-2">
      <FilterButton
        label={"All"}
        count={total}
        loading={anyLoading}
        onClick={() => setActiveProvider(null)}
        isActive={activeProvider === null}
      />
      {CONNECTOR_LIST.map((c: Connector) => (
        <FilterButton
          key={c.id}
          label={c.label}
          count={counts?.[c.id]}
          loading={isSearching || loadingByProvider?.[c.id]}
          onClick={() => setActiveProvider(c.id)}
          isActive={activeProvider === c.id}
        />
      ))}
    </div>
  );
};

export default FilterRow;

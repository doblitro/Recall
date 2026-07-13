import { Loader } from "lucide-react";
import { ProviderFilter } from "@/app/providers/SearchFilterProvider";
import { CONNECTOR_LIST } from "@/lib/connectors/public";
import { Connector } from "@/lib/connectors/types";
import Image from "next/image";

const FilterButton = ({
  label,
  image,
  count,
  loading,
  onClick,
  isActive,
}: {
  label: string;
  image?: string | undefined;
  count?: number;
  loading?: boolean;
  onClick: () => void;
  isActive: boolean;
}) => {
  const activeButton = "border-2 border-input shadow-input";

  return (
    <button
      onClick={onClick}
      className={`text-foreground flex items-center gap-1.5 rounded-xl px-2 py-1
        hover:cursor-pointer ${isActive && activeButton}`}
    >
      {image && (
        <Image
          src={image}
          alt={`${label} Logo`}
          width={20}
          height={20}
          draggable={false}
        />
      )}
      {label}
      {loading ? (
        <Loader
          key="loading"
          className="text-muted-foreground ml-1 inline size-3 animate-spin
            text-sm"
          aria-label="Loading"
          role="status"
        />
      ) : (
        count !== undefined && (
          <span key="count" className="animate-fade-in ml-0.5 text-xs">
            {count}
          </span>
        )
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
          image={c.image ? c.image : undefined}
          loading={isSearching || loadingByProvider?.[c.id]}
          onClick={() => setActiveProvider(c.id)}
          isActive={activeProvider === c.id}
        />
      ))}
    </div>
  );
};

export default FilterRow;

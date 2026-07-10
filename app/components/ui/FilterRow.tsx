import { ProviderFilter } from "@/app/providers/SearchFilterProvider";
import { CONNECTOR_LIST } from "@/lib/connectors/public";
import { Connector } from "@/lib/connectors/types";

const FilterButton = ({
  label,
  onClick,
  isActive,
}: {
  label: string;
  onClick: () => any;
  isActive: boolean;
}) => {
  const activeButton = "text-accent-foreground bg-accent";
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded ${isActive && activeButton}`}
    >
      {label}
    </button>
  );
};

const FilterRow = ({
  activeProvider,
  setActiveProvider,
}: {
  activeProvider: ProviderFilter;
  setActiveProvider: (id: ProviderFilter) => void;
}) => {
  return (
    <div>
      <FilterButton
        label={"All"}
        onClick={() => setActiveProvider(null)}
        isActive={activeProvider === null}
      />
      {CONNECTOR_LIST.map((c: Connector) => (
        <FilterButton
          key={c.id}
          label={c.label}
          onClick={() => setActiveProvider(c.id)}
          isActive={activeProvider === c.id}
        />
      ))}
    </div>
  );
};

export default FilterRow;

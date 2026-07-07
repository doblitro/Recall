import { providersArray } from "./providers";
import { ConnectorProvider } from "./types";

export const providersRecord: Record<string, ConnectorProvider> =
  providersArray.reduce(
    (acc, item) => {
      acc[item.id] = item;
      return acc;
    },
    {} as Record<string, ConnectorProvider>,
  );

export function getProvider(id: string): ConnectorProvider | undefined {
  return providersRecord[id];
}

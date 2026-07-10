"use client";

import { CONNECTOR_LIST } from "@/lib/connectors/public";
import ConnectButtons from "../auth/ConnectButtons";

const ProviderConnections = () => {
  return (
    <div className="flex w-full flex-col gap-6">
      {CONNECTOR_LIST.map((connector) => (
        <div
          key={connector.id}
          className="flex w-full flex-col items-stretch gap-2"
        >
          <h3 className="font-semibold">{connector.label}</h3>
          <ConnectButtons type={connector.id} />
        </div>
      ))}
    </div>
  );
};

export default ProviderConnections;

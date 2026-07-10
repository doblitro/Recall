"use client";

import { CONNECTOR_LIST } from "@/lib/connectors/public";
import ConnectButtons from "../auth/ConnectButtons";
import Image from "next/image";

const ProviderConnections = () => {
  return (
    <div className="flex w-full flex-col gap-6">
      {CONNECTOR_LIST.map((connector) => (
        <div
          key={connector.id}
          className="flex w-full flex-col items-stretch gap-2"
        >
          <div className="flex gap-1.5 whitespace-nowrap">
            {connector.image && (
              <Image
                src={connector.image}
                alt={`${connector.label} Logo`}
                width={20}
                height={20}
              />
            )}
            <h3 className="font-semibold">{connector.label}</h3>
          </div>
          <ConnectButtons type={connector.id} />
        </div>
      ))}
    </div>
  );
};

export default ProviderConnections;

"use client";

import { CONNECTOR_LIST } from "@/lib/connectors/public";
import ConnectButtons from "../auth/ConnectButtons";
import Image from "next/image";

const ProviderConnections = () => {
  return (
    <div className="relative flex w-full flex-col p-4">
      <div className="bg-surface sticky top-0 isolate z-10 -mx-4 -mt-4 px-4 pt-4 pb-3">
        <h3 className="text-sm font-bold">Connections</h3>
      </div>
      <div className="flex-1 space-y-2">
        {CONNECTOR_LIST.map((connector) => (
          <div
            key={connector.id}
            className="border-accent-foreground bg-background flex w-full flex-col items-stretch gap-2 rounded-xl border p-4"
          >
            <div className="flex gap-1.5 whitespace-nowrap">
              {connector.image && (
                <Image
                  src={connector.image}
                  alt={`${connector.label} Logo`}
                  width={14}
                  height={14}
                  draggable={false}
                />
              )}
              <h4 className="text-sm font-semibold">{connector.label}</h4>
            </div>
            <ConnectButtons type={connector.id} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProviderConnections;

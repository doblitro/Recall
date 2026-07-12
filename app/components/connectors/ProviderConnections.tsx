"use client";

import { CONNECTOR_LIST } from "@/lib/connectors/public";
import ConnectButtons from "../auth/ConnectButtons";
import Image from "next/image";
import { Connector } from "@/lib/connectors/types";
import { Skeleton } from "../ui/Skeleton";
import { useSession } from "next-auth/react";
import useConnections, { Connection } from "@/app/hooks/useConnections";

const ConnectorGroupCard = ({
  isSkeleton,
  connector,
  connections,
  onRefresh,
}: {
  isSkeleton?: boolean;
  connector?: Connector;
  connections?: Connection[];
  onRefresh?: () => void;
}) => {
  return (
    <div
      key={connector?.id}
      className="border-accent-foreground bg-background flex w-full flex-col items-stretch gap-2 rounded-xl border p-4"
    >
      {connector && !isSkeleton ? (
        <>
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
          <ConnectButtons
            type={connector.id}
            connections={connections ?? []}
            onRefresh={onRefresh ?? (() => {})}
          />
        </>
      ) : (
        <>
          <div className="flex gap-1.5 whitespace-nowrap">
            <Skeleton className="h-3.5 w-3.5 rounded-lg" />
            <Skeleton className="h-3.5 w-full rounded-lg" />
          </div>
          <Skeleton className="h-3.5 w-full rounded-lg" />
          <Skeleton className="h-3.5 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </>
      )}
    </div>
  );
};

const ProviderConnections = () => {
  const { status } = useSession();
  const {
    connectionsByProvider,
    refresh,
    isLoading: connectionsLoading,
  } = useConnections();
  const isLoading = status === "loading" || connectionsLoading;

  return (
    <div className="relative flex w-full flex-col p-4">
      <div className="bg-surface sticky top-0 isolate z-10 -mx-4 -mt-4 px-4 pt-4 pb-3">
        <h3 className="text-sm font-bold">Connections</h3>
      </div>
      <div className="flex-1 space-y-2">
        {CONNECTOR_LIST.map((connector) => (
          <ConnectorGroupCard
            key={connector.id}
            connector={connector}
            isSkeleton={isLoading}
            connections={connectionsByProvider[connector.id]}
            onRefresh={refresh}
          />
        ))}
      </div>
    </div>
  );
};

export default ProviderConnections;

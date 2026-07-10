"use client";

import useConnections from "@/app/hooks/useConnections";

const ConnectorResults = ({
  providerId,
  heading,
  children,
  hidden,
}: {
  providerId: string;
  heading: string;
  children: React.ReactNode;
  hidden?: boolean;
}) => {
  const { connections } = useConnections(providerId);

  if (connections.length === 0) return null;

  return (
    <div className={`flex flex-col gap-2 w-full ${hidden ? "hidden" : ""}`}>
      <h2 className="text-lg font-semibold">{heading}</h2>
      {children}
    </div>
  );
};

export default ConnectorResults;

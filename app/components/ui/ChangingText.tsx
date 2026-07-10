"use client";

import { CONNECTOR_LIST } from "@/lib/connectors/public";
import { TypeAnimation } from "react-type-animation";

const ChangingText = () => {
  return (
    <span>
      Find something from{" "}
      <TypeAnimation
        sequence={CONNECTOR_LIST.flatMap((c) => [c.label, 2500])}
        speed={50}
        repeat={Infinity}
        className="text-accent font-medium"
      />
    </span>
  );
};

export default ChangingText;

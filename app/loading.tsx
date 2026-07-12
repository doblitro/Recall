import { LoaderIcon } from "lucide-react";
import Image from "next/image";

const loading = () => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <Image
          src="/icon.svg"
          alt="Recall icon"
          height={36}
          width={36}
          draggable={false}
        />
        <LoaderIcon height={20} width={20} className="animate-spin" />
      </div>
    </div>
  );
};

export default loading;

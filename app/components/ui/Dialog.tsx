"use client";

import { ReactNode, useEffect, useRef } from "react";

const Dialog = ({
  isOpen,
  type,
  message,
  buttons,
  onClose,
}: {
  isOpen: boolean;
  type: string;
  message: string;
  buttons?: ReactNode;
  onClose?: () => void;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const textColor =
    type === "success"
      ? "text-success"
      : type === "error"
        ? "text-danger"
        : type === "warning"
          ? "text-warning"
          : "text-foreground";

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="bg-surface border-border m-auto w-[90vw] max-w-sm rounded-lg
        border p-6 shadow-xl backdrop:bg-black/50"
    >
      <div className="space-y-4">
        <p className={`text-sm font-medium ${textColor}`}>{message}</p>
        {buttons && <div className="flex gap-3">{buttons}</div>}
      </div>
    </dialog>
  );
};

export default Dialog;

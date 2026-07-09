import { ExternalLinkIcon } from "lucide-react";
import { AnchorHTMLAttributes, ReactNode } from "react";

const Link = ({
  href,
  children,
  showIcon = false,
  className,
  ...rest
}: {
  href: string;
  children: ReactNode;
  showIcon?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) => {
  return (
    <a
      href={href}
      className={[
        "inline-flex items-center gap-1 whitespace-nowrap text-accent",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <span className="whitespace-nowrap">{children}</span>
      {showIcon && (
        <ExternalLinkIcon width={10} height={10} className="shrink-0" />
      )}
    </a>
  );
};

export default Link;

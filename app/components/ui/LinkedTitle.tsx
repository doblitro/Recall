import Link from "./Link";

const LinkedTitle = ({ url, html }: { url?: string; html: string }) =>
  url ? (
    <Link href={url} target="_blank" rel="noopener noreferrer" showIcon>
      <span dangerouslySetInnerHTML={{ __html: html }} />
    </Link>
  ) : (
    <span dangerouslySetInnerHTML={{ __html: html }} />
  );

export default LinkedTitle;

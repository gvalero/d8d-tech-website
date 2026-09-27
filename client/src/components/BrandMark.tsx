type BrandMarkProps = {
  className?: string;
  compact?: boolean;
  title?: string;
};

/**
 * Original D8D Tech wordmark. The D forms frame a continuous teal eight — a
 * quiet cue of a useful device's next chapter, not a certification claim.
 */
export default function BrandMark({
  className = "",
  compact = false,
  title = "D8D Tech",
}: BrandMarkProps) {
  if (compact) {
    return (
      <svg
        className={className}
        viewBox="0 0 110 64"
        role="img"
        aria-label={title}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M7 10v44h14a22 22 0 1 0 0-44H7Zm14 8a14 14 0 1 1 0 28h-6V18h6Z" fill="currentColor" />
        <path d="M55 11c-9 0-15 6-15 13 0 6 4 10 9 12-6 3-10 7-10 13 0 8 7 14 16 14s16-6 16-14c0-6-4-10-10-13 5-2 9-6 9-12 0-7-6-13-15-13Zm0 8c4 0 7 3 7 6s-3 6-7 6-7-3-7-6 3-6 7-6Zm0 21c5 0 8 3 8 7s-3 8-8 8-8-4-8-8 3-7 8-7Z" fill="#30BFA5" />
        <path d="M103 10v44H89a22 22 0 1 1 0-44h14Zm-14 8a14 14 0 1 0 0 28h6V18h-6Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 268 64"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="currentColor">
        <path d="M4 10v44h14a22 22 0 1 0 0-44H4Zm14 8a14 14 0 1 1 0 28h-6V18h6Z" />
        <path d="M100 10v44H86a22 22 0 1 1 0-44h14Zm-14 8a14 14 0 1 0 0 28h6V18h-6Z" />
        <path d="M112 15h33v9h-11v25h-11V24h-11V15Z" />
        <path d="M151 15h31v9h-20v4h18v8h-18v5h20v9h-31V15Z" />
        <path d="M188 32c0-11 7-18 18-18 7 0 13 3 17 8l-8 5c-2-3-5-4-8-4-5 0-8 3-8 9s3 9 8 9c4 0 7-2 9-5l8 5c-4 6-10 9-18 9-11 0-18-7-18-18Z" />
        <path d="M232 15h11v12h11V15h11v34h-11V36h-11v13h-11V15Z" />
      </g>
      <path d="M52 11c-9 0-15 6-15 13 0 6 4 10 9 12-6 3-10 7-10 13 0 8 7 14 16 14s16-6 16-14c0-6-4-10-10-13 5-2 9-6 9-12 0-7-6-13-15-13Zm0 8c4 0 7 3 7 6s-3 6-7 6-7-3-7-6 3-6 7-6Zm0 21c5 0 8 3 8 7s-3 8-8 8-8-4-8-8 3-7 8-7Z" fill="#30BFA5" />
    </svg>
  );
}

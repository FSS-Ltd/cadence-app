type PrivacyBadgeProps = Readonly<{
  children: string;
  variant?: "private" | "shared";
}>;

export function PrivacyBadge({
  children,
  variant = "private",
}: PrivacyBadgeProps) {
  return (
    <span className={`privacy-badge privacy-badge-${variant}`}>
      <span aria-hidden="true">{variant === "private" ? "●" : "↗"}</span>
      {children}
    </span>
  );
}

import Image from "next/image";

type BrandMarkProps = Readonly<{ className: string }>;

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <Image
      className={className}
      src="/brand/cadence-mark.png"
      width={256}
      height={256}
      alt=""
      aria-hidden="true"
      priority
    />
  );
}

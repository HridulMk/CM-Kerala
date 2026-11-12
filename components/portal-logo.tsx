import Image from "next/image";

export function PortalLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      alt="Government of Kerala emblem"
      className={`object-contain ${className}`}
      height={425}
      src="/images/logo.png"
      width={680}
    />
  );
}

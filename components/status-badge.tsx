import Image from "next/image";
import type { ApplicationStatus } from "@/lib/domain/types";

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className="status" data-tone={status.tone}>
      <Image
        aria-hidden="true"
        src={`/visuals/status-${status.slug}.svg`}
        alt=""
        width={16}
        height={16}
      />
      {status.label}
    </span>
  );
}

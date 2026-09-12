import { Chip } from "@/components/admin/m3/Chip";

const TONES: Record<string, "success" | "warning" | "neutral"> = {
  published: "success",
  draft: "warning",
  archived: "neutral",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Chip tone={TONES[status] || "neutral"} variant="filled">
      {status}
    </Chip>
  );
}

import { Badge } from "@/components/ui/badge";

export function RiskBadge({ result }) {  // ✅ destructure props
  if (result === "Low Risk") {
    return (
      <Badge className="bg-emerald-500 text-white border-transparent">✅ Safe</Badge>
    );
  }
  if (result === "Medium Risk") {
    return (
      <Badge className="bg-amber-400 text-black border-transparent">⚠️ Needs Help</Badge>
    );
  }
  if (result === "High Risk") {
    return (
      <Badge className="bg-red-500 text-white border-transparent">🚨 At Risk</Badge>
    );
  }
  return (
    <Badge className="bg-gray-400 text-white border-transparent">❓ Unknown</Badge>
  );
}


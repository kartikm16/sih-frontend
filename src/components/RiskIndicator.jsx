import { Badge } from "@/components/ui/badge";

export function calculateRisk(input) {
  const { scores, attendancePct, familyIncome, feesPending } = input;
  const marks = Object.values(scores ?? {});
  const subjects = marks.length || 1;
  const avg = marks.reduce((a, b) => a + b, 0) / subjects;
  const backlogCount = marks.filter((m) => m < 40).length;

  // Weighted composite: 60% academics, 30% attendance, 10% socioeconomic
  let composite = 0.6 * avg + 0.3 * attendancePct;
  let reasons = [];

  // Socioeconomic adjustments
  if (typeof familyIncome === "number") {
    if (familyIncome < 200000) {
      composite -= 7;
      reasons.push("low family income");
    } else if (familyIncome < 500000) {
      composite -= 3;
    }
  }
  if (feesPending) {
    composite -= 10;
    reasons.push("fees pending");
  }

  // Backlog penalties
  if (backlogCount > 0) {
    composite -= Math.min(25, backlogCount * 8);
    reasons.push(`${backlogCount} backlog${backlogCount > 1 ? "s" : ""}`);
  }

  composite = Math.max(0, Math.min(100, Math.round(composite)));

  let zone = "green";
  if (composite < 50 || attendancePct < 60 || avg < 50) zone = "yellow";
  if (composite < 35 || attendancePct < 50 || avg < 40 || backlogCount >= 3) zone = "red";

  return { zone, backlogCount, reasons, score: composite };
}

export function RiskBadge({ result }) {
  if (result.zone === "green") {
    return (
      <Badge className="bg-emerald-500 text-white border-transparent">✅ Safe</Badge>
    );
  }
  if (result.zone === "yellow") {
    return (
      <Badge className="bg-amber-400 text-black border-transparent">⚠️ Needs Help</Badge>
    );
  }
  return (
    <Badge className="bg-red-500 text-white border-transparent">🚨 At Risk</Badge>
  );
}

import { EarningsCalculator } from "@/components/earnings-calculator";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <EarningsCalculator />
    </main>
  );
}
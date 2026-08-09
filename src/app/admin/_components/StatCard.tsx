"use client";

/* ============================================
   StatCard — tarjeta de estadística del panel
   Reutilizada por las pestañas Dashboard y Canciones.
   ============================================ */

export type StatColor = "burgundy" | "sage" | "rose" | "silver" | "champagne";

interface StatCardProps {
  label: string;
  value: number;
  color: StatColor;
}

const COLOR_MAP: Record<StatColor, string> = {
  burgundy: "bg-burgundy text-ivory",
  sage: "bg-sage text-ivory",
  rose: "bg-rose text-ivory",
  silver: "bg-silver text-ivory",
  champagne: "bg-champagne text-burgundy",
};

export function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="glass p-6 text-center">
      <div
        className={`inline-flex items-center justify-center w-14 h-14 rounded-full text-2xl text-display mb-3 ${COLOR_MAP[color]}`}
      >
        {value}
      </div>
      <p className="text-body text-sm text-burgundy/60 uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}

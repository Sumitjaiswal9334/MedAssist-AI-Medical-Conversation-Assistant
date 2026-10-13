function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-clinic-line bg-white/85 p-4">
      <p className="text-xs font-semibold uppercase text-clinic-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-clinic-ink">{value}</p>
    </div>
  );
}

export default Metric;

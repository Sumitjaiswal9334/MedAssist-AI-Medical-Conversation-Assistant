function FeatureCard({ icon: Icon, title, text }) {
  return (
    <article className="rounded-lg border border-clinic-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-clinic-mint text-clinic-teal">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-clinic-muted">{text}</p>
    </article>
  );
}

export default FeatureCard;

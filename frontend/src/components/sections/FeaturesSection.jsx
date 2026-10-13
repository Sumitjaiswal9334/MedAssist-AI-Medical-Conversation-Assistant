import FeatureCard from "../ui/FeatureCard";
import { features } from "../../constants/features";

function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <div className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}

export default FeaturesSection;

/**
 * NOTE: intentionally using a plain <section> instead of the <Section>
 * (Framer Motion) wrapper. Framer Motion sets transform: translateY(40px)
 * initially on its element. Any ancestor with a CSS transform becomes the
 * containing block for position:fixed descendants — exactly what GSAP's pin
 * creates. Using a plain <section> eliminates that stacking-context conflict.
 */
import portfolio from '@/data/portfolio';
import PinnedExperience from '@/components/sections/PinnedExperience';

export default function Experience() {
  return (
    <section id="experience" className="py-16 sm:py-20">
      <PinnedExperience items={portfolio.experiences} />
    </section>
  );
}

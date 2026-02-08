import { Hero } from './components/Hero';
import { Problem } from './components/Problem';
import { Solution } from './components/Solution';
import { TargetAudience } from './components/TargetAudience';
import { SetupReal } from './components/SetupReal';
import { Integration } from './components/Integration';
import { HardwareFlex } from './components/HardwareFlex';
import { IntegrationDelivery } from './components/IntegrationDelivery';
import { IntegrationHumor } from './components/IntegrationHumor';
import { Testimonial } from './components/Testimonial';
import { HowItWorks } from './components/HowItWorks';
import { Demonstration } from './components/Demonstration';
import { Positioning } from './components/Positioning';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';

function App() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Problem />
      <Solution />
      <TargetAudience />
      <SetupReal />
      <Integration />
      <HardwareFlex />
      <IntegrationDelivery />
      <IntegrationHumor />
      <Testimonial />
      <HowItWorks />
      <Demonstration />
      <Positioning />
      <FAQ />
      <Footer />
    </main>
  );
}

export default App;

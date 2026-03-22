/**
 * Blog: The True Cost of Running a Restaurant POS in the UK (2026)
 * Target: UK restaurants (middle of funnel)
 * Slug: /blog/true-cost-pos-uk
 * Language: English (British)
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MadeWithLoveFooter } from "../../components/MadeWithLoveFooter";

const META_TITLE =
  "The True Cost of Running a Restaurant POS in the UK (2026) | ChefiApp";
const META_DESCRIPTION =
  "Beyond the monthly fee: transaction charges, hardware lock-in, add-on costs, and hidden margins. A breakdown of what UK restaurants actually pay for POS systems in 2026.";
const CANONICAL_URL = "https://chefiapp.com/blog/true-cost-pos-uk";

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function BlogPOSCostUKPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = META_TITLE;
    setMeta("description", META_DESCRIPTION);
    setMeta(
      "keywords",
      "POS cost UK, restaurant POS price, POS transaction fees, restaurant technology cost, POS system comparison UK, cheap POS restaurant, POS hidden fees, restaurant software UK 2026",
    );
    setMeta("og:title", META_TITLE, true);
    setMeta("og:description", META_DESCRIPTION, true);
    setMeta("og:type", "article", true);
    setMeta("og:url", CANONICAL_URL, true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", META_TITLE);
    setMeta("twitter:description", META_DESCRIPTION);

    let linkCanonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.rel = "canonical";
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.href = CANONICAL_URL;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: META_TITLE,
      description: META_DESCRIPTION,
      url: CANONICAL_URL,
      datePublished: "2026-03-22",
      dateModified: "2026-03-22",
      author: { "@type": "Organization", name: "ChefiApp" },
      publisher: {
        "@type": "Organization",
        name: "ChefiApp",
        logo: {
          "@type": "ImageObject",
          url: "https://chefiapp.com/logo-chefiapp-clean.png",
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": CANONICAL_URL,
      },
    };
    let scriptJsonLd = document.getElementById(
      "blog-article-jsonld",
    ) as HTMLScriptElement | null;
    if (!scriptJsonLd) {
      scriptJsonLd = document.createElement("script");
      scriptJsonLd.id = "blog-article-jsonld";
      scriptJsonLd.type = "application/ld+json";
      document.head.appendChild(scriptJsonLd);
    }
    scriptJsonLd.textContent = JSON.stringify(jsonLd);

    return () => {
      document.title = prevTitle;
      scriptJsonLd?.remove();
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#0b0b0f] text-neutral-100">
      {/* Sticky header */}
      <header className="border-b border-white/5 bg-[#0b0b0f]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/landing-v2" className="flex items-center gap-2">
            <img
              src="/logo-chefiapp-clean.png"
              alt="ChefiApp"
              className="w-6 h-6 rounded"
            />
            <span className="text-sm font-semibold text-white">ChefiApp</span>
          </Link>
          <Link
            to="/auth/email"
            className="text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors"
          >
            Start free trial
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <p className="text-amber-500/90 text-sm font-medium uppercase tracking-wider mb-4">
          Blog &middot; POS Costs &middot; UK Market
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          The True Cost of Running a Restaurant POS in the UK (2026)
        </h1>
        <p className="text-neutral-400 text-lg mb-10">
          Most POS companies advertise a clean monthly price. What they do not
          advertise is the transaction fees, the add-on charges, the hardware
          lock-in, and the slow accumulation of costs that can double or triple
          what you thought you were paying. This article breaks down what UK
          restaurants actually spend on their POS systems &mdash; and what the
          alternatives look like.
        </p>

        <section className="prose prose-invert prose-amber max-w-none mb-14">
          {/* Section 1 */}
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            What you actually pay for a POS system (beyond the monthly fee)
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            The advertised price of a restaurant POS in the UK typically ranges
            from &pound;29 to &pound;99 per month for the base plan. That number
            is real, but it is only the starting point. The total cost of
            ownership includes several layers that are rarely mentioned on the
            pricing page.
          </p>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Here is what a typical UK restaurant POS bill actually looks like:
          </p>
          <ul className="list-disc pl-6 text-neutral-300 space-y-2 mb-6">
            <li>Base subscription (monthly or annual)</li>
            <li>Transaction fees on every card payment</li>
            <li>Add-on modules (KDS, bookings, loyalty, analytics)</li>
            <li>Hardware costs (terminals, printers, card readers)</li>
            <li>Setup and installation fees</li>
            <li>Training and onboarding charges</li>
            <li>Contract termination penalties</li>
          </ul>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Each of these adds up. Let us look at the biggest ones in detail.
          </p>

          {/* Section 2 */}
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Transaction fees: the hidden margin killer
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            This is the cost that most restaurant owners underestimate. Many POS
            providers in the UK charge between 1.5% and 2.5% on every card
            transaction processed through their integrated payment system.
          </p>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Let us run the numbers for a modest restaurant:
          </p>

          {/* Calculation box */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 mb-6">
            <p className="text-amber-500 font-semibold mb-3">
              Example: Transaction fees at 2.5%
            </p>
            <ul className="text-neutral-300 space-y-2 text-sm">
              <li>
                Monthly card revenue: <strong>&pound;25,000</strong>
              </li>
              <li>
                Transaction fee (2.5%):{" "}
                <strong className="text-amber-400">&pound;625/month</strong>
              </li>
              <li>
                Annual transaction fees:{" "}
                <strong className="text-amber-400">&pound;7,500/year</strong>
              </li>
            </ul>
            <p className="text-neutral-400 text-sm mt-3">
              That is &pound;7,500 per year on top of your subscription
              &mdash; more than most restaurants pay in monthly POS fees
              combined.
            </p>
          </div>

          <p className="text-neutral-300 leading-relaxed mb-4">
            For higher-volume restaurants doing &pound;50,000 or more per month
            in card payments, the annual transaction fee can exceed
            &pound;15,000. At that point, the &ldquo;cheap&rdquo; POS system is
            one of the most expensive line items on your P&amp;L after rent and
            wages.
          </p>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Some providers offer lower rates if you commit to longer contracts
            or use their proprietary card reader. This creates a lock-in effect:
            you get a slightly better rate, but you cannot switch without
            financial penalties.
          </p>

          {/* Section 3 */}
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Add-on costs: KDS, bookings, staff tools, analytics
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Many POS systems advertise a low base price because core features
            are sold as separate modules. Need a kitchen display system? That is
            an extra &pound;15&ndash;&pound;30 per month. Want table bookings?
            Another &pound;20&ndash;&pound;50. Staff scheduling and tip
            management? Additional charges.
          </p>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Here is a realistic breakdown of add-on costs for a
            full-featured restaurant POS in the UK:
          </p>
          <ul className="list-disc pl-6 text-neutral-300 space-y-2 mb-6">
            <li>
              Kitchen display (KDS): &pound;15&ndash;&pound;30/month
            </li>
            <li>
              Online bookings/reservations: &pound;20&ndash;&pound;50/month
            </li>
            <li>Loyalty and marketing: &pound;20&ndash;&pound;40/month</li>
            <li>Advanced analytics: &pound;10&ndash;&pound;25/month</li>
            <li>
              Staff management: &pound;10&ndash;&pound;20/month
            </li>
            <li>
              Multi-location management: &pound;30&ndash;&pound;60/month
            </li>
          </ul>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Added together, a restaurant using four or five modules can easily
            spend &pound;100&ndash;&pound;180 per month on top of the base
            subscription. The &ldquo;&pound;29/month POS&rdquo; becomes
            &pound;150/month before transaction fees.
          </p>

          {/* Section 4 */}
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Hardware lock-in: the cost of proprietary terminals
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Some POS providers sell or lease proprietary hardware: purpose-built
            terminals, branded card readers, and custom receipt printers. The
            upfront cost can range from &pound;300 to &pound;1,500 per terminal.
          </p>
          <p className="text-neutral-300 leading-relaxed mb-4">
            The problem is not just the price &mdash; it is the lock-in.
            Proprietary hardware only works with that provider&rsquo;s software.
            If you want to switch POS systems, your terminals become expensive
            paperweights. This creates an artificial switching cost that keeps
            restaurants on systems they have outgrown.
          </p>
          <p className="text-neutral-300 leading-relaxed mb-4">
            The alternative is hardware-agnostic software that runs on any
            tablet, laptop, or phone with a browser. An iPad or Android tablet
            costs &pound;200&ndash;&pound;400 and works with any system. A
            standard ESC/POS thermal printer costs &pound;50&ndash;&pound;100
            and connects to anything.
          </p>

          {/* Section 5 - Comparison table */}
          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Total cost comparison: legacy vs all-in-one
          </h2>
          <p className="text-neutral-300 leading-relaxed mb-6">
            Here is a side-by-side comparison of annual costs for a UK
            restaurant processing &pound;25,000/month in card payments:
          </p>

          {/* Comparison table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-neutral-400 font-medium">
                    Cost item
                  </th>
                  <th className="text-right py-3 px-4 text-neutral-400 font-medium">
                    Legacy POS
                  </th>
                  <th className="text-right py-3 px-4 text-amber-500 font-medium">
                    ChefiApp
                  </th>
                </tr>
              </thead>
              <tbody className="text-neutral-300">
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4">Base subscription</td>
                  <td className="text-right py-3 px-4">
                    &pound;69/mo (&pound;828/yr)
                  </td>
                  <td className="text-right py-3 px-4 text-amber-400">
                    &pound;42/mo (&pound;504/yr)
                  </td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4">Transaction fees (2.5%)</td>
                  <td className="text-right py-3 px-4">
                    &pound;7,500/yr
                  </td>
                  <td className="text-right py-3 px-4 text-amber-400">
                    &pound;0
                  </td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4">KDS add-on</td>
                  <td className="text-right py-3 px-4">&pound;300/yr</td>
                  <td className="text-right py-3 px-4 text-amber-400">
                    Included
                  </td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4">Bookings add-on</td>
                  <td className="text-right py-3 px-4">&pound;360/yr</td>
                  <td className="text-right py-3 px-4 text-amber-400">
                    Included
                  </td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4">Analytics add-on</td>
                  <td className="text-right py-3 px-4">&pound;180/yr</td>
                  <td className="text-right py-3 px-4 text-amber-400">
                    Included
                  </td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4">Staff tools add-on</td>
                  <td className="text-right py-3 px-4">&pound;180/yr</td>
                  <td className="text-right py-3 px-4 text-amber-400">
                    Included
                  </td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 px-4">Hardware (terminal)</td>
                  <td className="text-right py-3 px-4">
                    &pound;800 (one-off)
                  </td>
                  <td className="text-right py-3 px-4 text-amber-400">
                    Any device
                  </td>
                </tr>
                <tr className="border-b border-white/10 font-semibold">
                  <td className="py-3 px-4 text-white">
                    Year 1 total
                  </td>
                  <td className="text-right py-3 px-4 text-white">
                    &pound;10,148
                  </td>
                  <td className="text-right py-3 px-4 text-amber-400">
                    &pound;504
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-neutral-400 text-sm italic mb-8">
            Figures are estimates based on publicly available pricing from major
            UK POS providers as of early 2026. ChefiApp does not charge
            transaction fees because payment processing happens through your
            existing card terminal or payment provider &mdash; you keep your
            existing rates.
          </p>

          {/* Section 6 - CTA */}
          <div className="mt-12 rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm p-8 md:p-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              Zero transaction fees. Everything included.
            </h2>
            <p className="text-neutral-300 leading-relaxed mb-4">
              ChefiApp includes POS, kitchen display, table management,
              bookings, staff tools, menu builder, analytics, and stock control
              in a single plan. No add-on modules. No per-transaction charges.
              No proprietary hardware.
            </p>
            <p className="text-neutral-300 leading-relaxed mb-6">
              From &pound;42/month. 14-day free trial. No credit card required.
              No contract.
            </p>
            <Link
              to="/auth/email"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/20"
            >
              Start your free trial
            </Link>
          </div>
        </section>

        {/* Bottom CTA bar */}
        <div className="border-t border-white/10 pt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-neutral-400 text-sm">
            Stop paying hidden fees. See what ChefiApp includes for one price.
          </p>
          <Link
            to="/auth/email"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/20"
          >
            Get started free
          </Link>
        </div>

        <nav className="mt-12 pt-8 border-t border-white/5 flex flex-wrap gap-4">
          <Link
            to="/landing-v2"
            className="text-sm text-amber-500 hover:text-amber-400 transition-colors"
          >
            &larr; Back to home
          </Link>
          <Link
            to="/blog/seasonal-restaurant-setup"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Seasonal restaurant setup guide &rarr;
          </Link>
          <Link
            to="/blog/restaurant-operating-system"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            What is a Restaurant OS? &rarr;
          </Link>
          <Link
            to="/blog/tpv-restaurantes"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            TPV para restaurantes &rarr;
          </Link>
        </nav>
      </article>

      <MadeWithLoveFooter variant="default" />
    </main>
  );
}

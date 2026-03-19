/**
 * PrivacyPolicyPage — Public GDPR privacy policy template for restaurants.
 *
 * Route: /privacy
 * Comprehensive policy covering data collection, processing, rights, cookies,
 * and contact information. Restaurants can customise via their admin panel.
 */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MadeWithLoveFooter } from "../../components/MadeWithLoveFooter";

const META_TITLE = "Privacy Policy — ChefIApp";
const META_DESCRIPTION =
  "Learn how ChefIApp protects your data. GDPR-compliant privacy policy covering data collection, processing, your rights, and cookie usage.";

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

const sectionClass = "mt-10";
const headingClass = "text-xl font-semibold text-white mb-3";
const subheadingClass = "text-lg font-semibold text-white/90 mb-2 mt-6";
const paraClass = "text-white/70 leading-relaxed mt-2";
const listClass = "text-white/70 leading-relaxed mt-2 ml-6 list-disc space-y-1";

export function PrivacyPolicyPage() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = META_TITLE;
    setMeta("description", META_DESCRIPTION);
    setMeta("og:title", META_TITLE, true);
    setMeta("og:description", META_DESCRIPTION, true);
    return () => {
      document.title = prevTitle;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#0b0b0f] text-white">
      <div className="container mx-auto px-6 py-16 max-w-3xl">
        {/* Header */}
        <div className="mb-4">
          <Link
            to="/"
            className="text-amber-400 hover:text-amber-300 text-sm"
          >
            &larr; Back to home
          </Link>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-white/50 text-sm mb-8">
          Last updated: March 2026
        </p>

        {/* Introduction */}
        <p className={paraClass}>
          This Privacy Policy explains how your personal data is collected, used,
          and protected when you use ChefIApp&apos;s restaurant management platform,
          including the POS terminal, online menu, reservation portal, and
          administrative dashboard.
        </p>
        <p className={paraClass}>
          We are committed to protecting your privacy and complying with the
          General Data Protection Regulation (GDPR), the Portuguese LGPD, and
          applicable data protection laws in Spain (LOPDGDD) and Brazil (LGPD).
        </p>

        {/* 1. Data Controller */}
        <section className={sectionClass}>
          <h2 className={headingClass}>1. Data Controller</h2>
          <p className={paraClass}>
            The data controller is the restaurant that operates this instance of
            ChefIApp. ChefIApp acts as a data processor on behalf of the
            restaurant. For questions about your personal data, please contact the
            restaurant directly or reach us via the contact details below.
          </p>
        </section>

        {/* 2. Data We Collect */}
        <section className={sectionClass}>
          <h2 className={headingClass}>2. Data We Collect</h2>

          <h3 className={subheadingClass}>2.1 Data you provide directly</h3>
          <ul className={listClass}>
            <li>Name, email address, and phone number (when placing orders, making reservations, or creating an account)</li>
            <li>Payment information (processed securely via third-party payment providers; we do not store card numbers)</li>
            <li>Dietary preferences or allergen information (when provided voluntarily)</li>
            <li>Feedback and communications</li>
          </ul>

          <h3 className={subheadingClass}>2.2 Data collected automatically</h3>
          <ul className={listClass}>
            <li>Device information (browser type, operating system, screen resolution)</li>
            <li>IP address (anonymised for analytics)</li>
            <li>Usage data (pages visited, features used, time spent)</li>
            <li>Cookies and similar technologies (see Section 7)</li>
          </ul>

          <h3 className={subheadingClass}>2.3 Operational data (restaurant staff)</h3>
          <ul className={listClass}>
            <li>Staff accounts (name, role, authentication credentials)</li>
            <li>Order processing and transaction records</li>
            <li>Shift and attendance records</li>
            <li>Audit logs of sensitive operations</li>
          </ul>
        </section>

        {/* 3. Legal Basis */}
        <section className={sectionClass}>
          <h2 className={headingClass}>3. Legal Basis for Processing</h2>
          <ul className={listClass}>
            <li><strong>Contract performance:</strong> processing orders, reservations, and payments</li>
            <li><strong>Legal obligation:</strong> tax records, financial reporting, fraud prevention</li>
            <li><strong>Consent:</strong> marketing communications, analytics cookies, third-party sharing</li>
            <li><strong>Legitimate interest:</strong> improving service quality, security monitoring, fraud detection</li>
          </ul>
        </section>

        {/* 4. How We Use Your Data */}
        <section className={sectionClass}>
          <h2 className={headingClass}>4. How We Use Your Data</h2>
          <ul className={listClass}>
            <li>Process and fulfil orders and reservations</li>
            <li>Send order confirmations and receipts</li>
            <li>Manage your account and preferences</li>
            <li>Improve our products and services</li>
            <li>Send marketing communications (only with your explicit consent)</li>
            <li>Comply with legal and regulatory requirements</li>
            <li>Detect and prevent fraud and security incidents</li>
          </ul>
        </section>

        {/* 5. Data Retention */}
        <section className={sectionClass}>
          <h2 className={headingClass}>5. Data Retention</h2>
          <p className={paraClass}>
            We retain personal data only for as long as necessary to fulfil the
            purposes described in this policy, unless a longer retention period is
            required by law:
          </p>
          <ul className={listClass}>
            <li><strong>Financial records and orders:</strong> 7 years (tax compliance)</li>
            <li><strong>Customer personal data:</strong> 3 years after last interaction</li>
            <li><strong>Analytics data:</strong> 1 year</li>
            <li><strong>Audit logs:</strong> 10 years</li>
          </ul>
          <p className={paraClass}>
            After the retention period expires, data is either deleted or
            irreversibly anonymised.
          </p>
        </section>

        {/* 6. Your Rights */}
        <section className={sectionClass}>
          <h2 className={headingClass}>6. Your Rights (GDPR Articles 15-22)</h2>
          <p className={paraClass}>You have the following rights regarding your personal data:</p>
          <ul className={listClass}>
            <li><strong>Right of access (Art. 15):</strong> request a copy of all personal data we hold about you</li>
            <li><strong>Right to rectification (Art. 16):</strong> correct inaccurate or incomplete data</li>
            <li><strong>Right to erasure (Art. 17):</strong> request deletion of your personal data (&quot;right to be forgotten&quot;)</li>
            <li><strong>Right to restriction (Art. 18):</strong> limit how we process your data</li>
            <li><strong>Right to data portability (Art. 20):</strong> receive your data in a structured, machine-readable format</li>
            <li><strong>Right to object (Art. 21):</strong> object to processing based on legitimate interest or for direct marketing</li>
            <li><strong>Right not to be subject to automated decisions (Art. 22):</strong> we do not make automated decisions that significantly affect you</li>
          </ul>
          <p className={paraClass}>
            To exercise any of these rights, contact the restaurant or use the
            privacy controls in the application. We will respond within 30 days.
          </p>
        </section>

        {/* 7. Cookies */}
        <section className={sectionClass}>
          <h2 className={headingClass}>7. Cookies and Similar Technologies</h2>
          <p className={paraClass}>We use the following categories of cookies:</p>
          <ul className={listClass}>
            <li><strong>Essential cookies:</strong> required for the site to function (authentication, session management, security). Always active.</li>
            <li><strong>Analytics cookies:</strong> help us understand how visitors use the site (page views, feature usage). Opt-in only.</li>
            <li><strong>Marketing cookies:</strong> used to deliver relevant advertising. Opt-in only.</li>
          </ul>
          <p className={paraClass}>
            You can manage your cookie preferences at any time using the cookie
            banner or from the footer of any page. We respect the Do Not Track
            (DNT) browser signal.
          </p>
        </section>

        {/* 8. Data Sharing */}
        <section className={sectionClass}>
          <h2 className={headingClass}>8. Data Sharing and Third Parties</h2>
          <p className={paraClass}>
            We do not sell your personal data. We may share data with:
          </p>
          <ul className={listClass}>
            <li><strong>Payment processors:</strong> to process transactions securely</li>
            <li><strong>Hosting and infrastructure providers:</strong> to operate the service</li>
            <li><strong>Analytics providers:</strong> to understand usage (only with your consent)</li>
            <li><strong>Legal authorities:</strong> when required by law or court order</li>
          </ul>
          <p className={paraClass}>
            All third-party processors are bound by data processing agreements
            (DPAs) and must comply with GDPR requirements.
          </p>
        </section>

        {/* 9. International Transfers */}
        <section className={sectionClass}>
          <h2 className={headingClass}>9. International Data Transfers</h2>
          <p className={paraClass}>
            Data may be processed in the European Economic Area (EEA). If data is
            transferred outside the EEA, we ensure appropriate safeguards are in
            place, such as Standard Contractual Clauses (SCCs) or adequacy
            decisions.
          </p>
        </section>

        {/* 10. Security */}
        <section className={sectionClass}>
          <h2 className={headingClass}>10. Data Security</h2>
          <p className={paraClass}>
            We implement appropriate technical and organisational measures to
            protect your data, including:
          </p>
          <ul className={listClass}>
            <li>Encryption in transit (TLS) and at rest</li>
            <li>Access controls and role-based permissions</li>
            <li>Regular security assessments</li>
            <li>Audit logging of sensitive operations</li>
            <li>Incident response procedures</li>
          </ul>
        </section>

        {/* 11. Children */}
        <section className={sectionClass}>
          <h2 className={headingClass}>11. Children&apos;s Privacy</h2>
          <p className={paraClass}>
            Our service is not directed at children under 16. We do not knowingly
            collect personal data from children. If you believe a child has
            provided us with personal data, please contact us.
          </p>
        </section>

        {/* 12. Changes */}
        <section className={sectionClass}>
          <h2 className={headingClass}>12. Changes to This Policy</h2>
          <p className={paraClass}>
            We may update this Privacy Policy from time to time. Changes will be
            posted on this page with an updated &quot;Last updated&quot; date. For
            significant changes, we will provide additional notice (e.g., via
            email or in-app notification).
          </p>
        </section>

        {/* 13. Contact */}
        <section className={sectionClass}>
          <h2 className={headingClass}>13. Contact</h2>
          <p className={paraClass}>
            For privacy questions, data requests, or to exercise your rights:
          </p>
          <ul className={listClass}>
            <li>Use the privacy controls in the ChefIApp application</li>
            <li>Contact the restaurant that operates this instance</li>
            <li>
              Email:{" "}
              <a
                href="mailto:privacy@chefiapp.com"
                className="text-amber-400 hover:text-amber-300"
              >
                privacy@chefiapp.com
              </a>
            </li>
          </ul>
          <p className={paraClass}>
            You also have the right to lodge a complaint with your local data
            protection authority (e.g., CNPD in Portugal, AEPD in Spain, ANPD in
            Brazil, ICO in the UK).
          </p>
        </section>

        {/* Related links */}
        <section className={`${sectionClass} border-t border-white/10 pt-8`}>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link
              to="/legal/terms"
              className="text-amber-400 hover:text-amber-300"
            >
              Terms of Use
            </Link>
            <Link
              to="/legal/privacy"
              className="text-amber-400 hover:text-amber-300"
            >
              Legal Privacy Policy
            </Link>
            <Link
              to="/legal/dpa"
              className="text-amber-400 hover:text-amber-300"
            >
              Data Processing Agreement
            </Link>
          </div>
        </section>
      </div>

      <MadeWithLoveFooter />
    </main>
  );
}

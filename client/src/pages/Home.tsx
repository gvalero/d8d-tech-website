import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Mail,
  Menu,
  MessageCircle,
  MoveRight,
  Sparkles,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import BrandMark from "@/components/BrandMark";
import MeasurementConsent from "@/components/MeasurementConsent";

const approach = [
  {
    number: "01",
    title: "Assess with intention",
    text: "A clear focus on the essential functions and condition details that matter before a device moves into its next retail or wholesale chapter.",
  },
  {
    number: "02",
    title: "Prepare with precision",
    text: "Data care, honest grading and a considered presentation form the basis of the D8D Tech standard for pre-owned smartphones.",
  },
  {
    number: "03",
    title: "Trade with clarity",
    text: "Useful information, direct communication and a premium point of view for partners who value a better pre-owned device experience.",
  },
];

function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -36px" },
    );

    document.documentElement.classList.add("motion-ready");
    targets.forEach((target) => {
      const delay = target.dataset.revealDelay;
      if (delay) target.style.transitionDelay = `${delay}ms`;
      observer.observe(target);
    });

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("motion-ready");
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header">
        <div className="site-header__inner">
          <a className="brand-link" href="#top" aria-label="D8D Tech home">
            <BrandMark className="brand-link__mark" />
          </a>

          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href="#approach">Our standard</a>
            <a href="#audience">Partners</a>
            <a href="#contact">Contact</a>
          </nav>

          <a className="header-status" href="#status">
            <span className="status-dot" aria-hidden="true" />
            Launching soon
          </a>

          <button
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="sr-only">{menuOpen ? "Close" : "Open"} navigation menu</span>
            {menuOpen ? <X size={21} /> : <Menu size={22} />}
          </button>
        </div>

        <div id="mobile-menu" className={`mobile-menu ${menuOpen ? "mobile-menu--open" : ""}`}>
          <a href="#approach" onClick={closeMenu}>Our standard</a>
          <a href="#audience" onClick={closeMenu}>Partners</a>
          <a href="#contact" onClick={closeMenu}>Contact</a>
        </div>
      </header>

      <main id="main-content">
        <section id="top" className="hero" aria-labelledby="hero-title">
          <div className="hero__grain" aria-hidden="true" />
          <div className="hero__light hero__light--one" aria-hidden="true" />
          <div className="hero__light hero__light--two" aria-hidden="true" />
          <div className="hero__inner">
            <div className="hero__copy" data-reveal data-reveal-delay="60">
              <SectionEyebrow>
                <span className="eyebrow__spark"><Sparkles size={13} strokeWidth={2.25} /></span>
                Premium pre-owned smartphones / Ireland
              </SectionEyebrow>
              <h1 id="hero-title">
                A sharper standard<br />
                <em>for smartphone resale.</em>
              </h1>
              <p className="hero__intro">
                D8D Tech is building a clearer route to quality pre-owned smartphones—bringing considered sourcing, transparent preparation and a premium product experience to retail and wholesale partners.
              </p>
              <div className="hero__actions">
                <a className="button button--primary" href="#approach">
                  Explore our standard <ArrowDownRight size={18} />
                </a>
                <a className="text-link" href="#contact">
                  Start the conversation <MoveRight size={17} />
                </a>
              </div>
            </div>

            <div className="hero-object" aria-hidden="true" data-reveal data-reveal-delay="150">
              <div className="hero-object__halo" />
              <div className="device-card device-card--back">
                <span className="device-card__ring" />
              </div>
              <div className="device-card device-card--front">
                <div className="device-card__topline" />
                <div className="device-card__screen">
                  <span className="device-card__small">D8D</span>
                  <span className="device-card__eight">8</span>
                  <span className="device-card__small">TECH</span>
                </div>
                <div className="device-card__caption">PRE-OWNED SMARTPHONES / IRELAND</div>
              </div>
              <div className="hero-object__note">
                <span className="hero-object__note-dot" />
                Launching soon
              </div>
            </div>
          </div>
          <div className="hero__footer">
            <p>Premium pre-owned smartphones. Built for better trade.</p>
            <a href="#approach" aria-label="Explore the D8D Tech standard">
              <span>Scroll to discover</span><ArrowDownRight size={18} />
            </a>
          </div>
        </section>

        <section id="approach" className="approach section" aria-labelledby="approach-title">
          <div className="section__grid">
            <div className="section-intro" data-reveal>
              <SectionEyebrow>The D8D standard</SectionEyebrow>
              <h2 id="approach-title">Designed for confidence at every stage.</h2>
              <p>
                Every device journey is shaped around the details that matter: condition, data care, honest grading and a considered presentation ready for its next owner.
              </p>
              <p className="section-intro__note">
                A premium pre-owned experience starts with the right information, handled with care and presented with purpose.
              </p>
            </div>
            <ol className="approach-list" data-reveal data-reveal-delay="90">
              {approach.map((item) => (
                <li className="approach-card" key={item.number}>
                  <span className="approach-card__number">{item.number}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                  <ArrowUpRight className="approach-card__arrow" size={21} aria-hidden="true" />
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="audience" className="audience section" aria-labelledby="audience-title">
          <div className="audience__grid">
            <div className="audience__heading" data-reveal>
              <SectionEyebrow>Built for partnership</SectionEyebrow>
              <h2 id="audience-title">For retailers and wholesalers who expect more from pre-owned.</h2>
            </div>
            <div className="audience__details" data-reveal data-reveal-delay="90">
              <article>
                <span className="audience__icon audience__icon--circle" aria-hidden="true"><span /></span>
                <h3>Retail partners</h3>
                <p>Quality pre-owned smartphones presented with clear information, considered preparation and a premium point of view.</p>
              </article>
              <article>
                <span className="audience__icon audience__icon--bars" aria-hidden="true"><span /><span /><span /></span>
                <h3>Wholesale partners</h3>
                <p>A thoughtful trade relationship built around useful product information, practical handling and direct communication.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="status" className="status section" aria-labelledby="status-title">
          <div className="status__card" data-reveal>
            <div className="status__card-top">
              <SectionEyebrow>Launching soon</SectionEyebrow>
              <span className="status-pill"><span className="status-dot" /> Ireland</span>
            </div>
            <div className="status__content">
              <h2 id="status-title">The standard is <em>taking shape.</em></h2>
              <p>
                D8D Tech is preparing for launch in Ireland. Ordering and contact details will be shared when we are ready to open the conversation.
              </p>
              <div className="status__divider" />
              <ul className="status__facts">
                <li><Check size={17} aria-hidden="true" /> Focused on a premium pre-owned smartphone standard</li>
                <li><Check size={17} aria-hidden="true" /> Built for wholesale and retail partnership</li>
              </ul>
            </div>
            <div className="status__number" aria-hidden="true">08</div>
          </div>
        </section>

        <section id="contact" className="contact section" aria-labelledby="contact-title">
          <div className="contact__inner" data-reveal>
            <div className="contact__heading">
              <SectionEyebrow>Start the conversation</SectionEyebrow>
              <h2 id="contact-title">Ready to talk phones? <em>We’ll be in touch soon.</em></h2>
              <p>
                WhatsApp and email contact details will be announced as D8D Tech opens for business. We look forward to connecting with retail and wholesale partners.
              </p>
            </div>
            <div className="contact__channels" aria-label="Future contact channels">
              <div className="contact-channel">
                <span className="contact-channel__icon" aria-hidden="true"><MessageCircle size={21} /></span>
                <span><strong>WhatsApp</strong><small>Contact opening soon</small></span>
              </div>
              <div className="contact-channel">
                <span className="contact-channel__icon" aria-hidden="true"><Mail size={21} /></span>
                <span><strong>Email</strong><small>Contact opening soon</small></span>
              </div>
            </div>
          </div>
        </section>

        <section id="day-eight" className="day-eight day-eight--quiet section" aria-labelledby="day-eight-title">
          <div className="day-eight__orb day-eight__orb--left" aria-hidden="true" />
          <div className="day-eight__orb day-eight__orb--right" aria-hidden="true" />
          <div className="day-eight__grid" data-reveal>
            <div className="day-eight__label">
              <SectionEyebrow>The name, simply</SectionEyebrow>
              <BrandMark compact className="day-eight__symbol" title="D8D symbol" />
            </div>
            <div className="day-eight__copy">
              <h2 id="day-eight-title">A second life for <em>good technology.</em></h2>
              <p>
                <strong>Day Eight Devices</strong> is a simple way of expressing the opportunity in quality pre-owned tech: useful devices can have a valuable next chapter.
              </p>
              <div className="day-eight__rule" />
              <p className="day-eight__small">
                The D–8–D mark expresses that thought with a continuous central loop. It is a quiet detail of the identity, while the work remains focused on better smartphone resale.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer__top">
          <a className="footer-brand" href="#top" aria-label="Back to top">
            <BrandMark className="footer-brand__mark" />
          </a>
          <p>Premium pre-owned smartphones. Launching soon in Ireland.</p>
          <a className="footer-top-link" href="#top">Back to top <ArrowUpRight size={16} /></a>
        </div>
        <div className="site-footer__bottom">
          <p>© {new Date().getFullYear()} D8D Tech.</p>
          <p>Contact and ordering information will be announced at launch.</p>
        </div>
      </footer>
      <MeasurementConsent />
    </div>
  );
}

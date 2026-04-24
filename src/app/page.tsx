"use client";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Link from "next/link";
import { useEffect } from "react";
import "./landing.css";

export default function Home() {
  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>(".reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    reveals.forEach((element) => observer.observe(element));

    document
      .querySelectorAll<HTMLElement>(".step, .feature, .testimonial, .nigeria-list li")
      .forEach((element, index) => {
        element.style.transitionDelay = `${(index % 3) * 0.1}s`;
      });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <nav>
        <div className="logo">
          CV<span>Padi</span>
        </div>
        <div className="nav-right">
          <ThemeToggle className="landing-theme-toggle" />
          <ul>
            <li>
              <a href="#how">How it works</a>
            </li>
            <li>
              <a href="#features">Features</a>
            </li>
            <li>
              <a href="#pricing">Pricing</a>
            </li>
            <li>
              <Link href="/salary">Salary database</Link>
            </li>
            <li>
              <Link href="/login" className="nav-cta">
                Build my CV -&gt;
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <section className="hero">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div className="hero-eyebrow">Nigeria&apos;s CV platform</div>

        <h1 className="hero-headline">
          <div className="line">
            <span>Your CV,</span>
          </div>
          <div className="line">
            <span>
              Nigerian <em className="accent">standard.</em>
            </span>
          </div>
          <div className="line">
            <span>
              <span className="orange">Done in 8 mins.</span>
            </span>
          </div>
        </h1>

        <p className="hero-sub">
          Built for Nigerian employers. NYSC status, 2 referees, correct date of birth format.
          Not a generic template — a CV that actually gets you called.
        </p>

        <div className="hero-actions">
          <Link href="/build" className="btn-primary">
            Start building free <span className="arrow">&rarr;</span>
          </Link>
          <Link href="/check" className="btn-ghost">
            Check my existing CV
          </Link>
        </div>
      </section>

      <section id="how">
        <div className="section-label reveal">How it works</div>
        <h2 className="section-headline reveal reveal-delay-1">
          Three steps.
          <br />
          One job-ready CV.
        </h2>
        <div className="steps">
          <div className="step reveal">
            <div className="step-num">01</div>
            <div className="step-title">Answer questions</div>
            <div className="step-desc">
              One question at a time. We guide you through every section Nigerian employers
              actually check — NYSC status, referees, state of origin, everything.
            </div>
          </div>
          <div className="step reveal reveal-delay-1">
            <div className="step-num">02</div>
            <div className="step-title">Preview your CV</div>
            <div className="step-desc">
              See a scored preview instantly. Get up to 5 specific tips that will improve your
              score before you pay a kobo. Know exactly what you&apos;re getting.
            </div>
          </div>
          <div className="step reveal reveal-delay-2">
            <div className="step-num">03</div>
            <div className="step-title">Pay & download</div>
            <div className="step-desc">
              Pay with card, bank transfer, or USSD — whatever works for you. Get your PDF and a
              WhatsApp-ready image delivered instantly to your inbox.
            </div>
          </div>
        </div>
      </section>

      <section className="nigeria-section">
        <div className="section-label reveal">Built for Nigeria</div>
        <h2 className="section-headline reveal reveal-delay-1">
          Every field a Nigerian
          <br />
          employer expects.
        </h2>

        <div className="nigeria-grid">
          <ul className="nigeria-list">
            <li className="reveal">
              <span className="check">✓</span>
              <span>
                <strong>NYSC status</strong> — Discharged, Exempted, Ongoing, or Not yet. Formatted
                correctly every time.
              </span>
            </li>
            <li className="reveal reveal-delay-1">
              <span className="check">✓</span>
              <span>
                <strong>2 referees</strong> — Standard Nigerian format. Name, title, company,
                phone, and email.
              </span>
            </li>
            <li className="reveal reveal-delay-2">
              <span className="check">✓</span>
              <span>
                <strong>Date of birth</strong> — Always included. Nigerian CVs require it, unlike
                Western formats.
              </span>
            </li>
            <li className="reveal reveal-delay-3">
              <span className="check">✓</span>
              <span>
                <strong>State of origin</strong> — A field that matters in Nigerian hiring. We
                include it properly.
              </span>
            </li>
            <li className="reveal">
              <span className="check">✓</span>
              <span>
                <strong>Passport photo slot</strong> — The photo most Nigerian employers still
                expect on a CV.
              </span>
            </li>
            <li className="reveal reveal-delay-1">
              <span className="check">✓</span>
              <span>
                <strong>Nigerian phone format</strong> — We validate 07X, 08X, 09X automatically.
                No more embarrassing wrong numbers.
              </span>
            </li>
          </ul>

          <div style={{ position: "relative", paddingBottom: "40px" }}>
            <div className="cv-mock reveal reveal-delay-2">
              <div className="cv-mock-badge">✓ Nigerian format</div>
              <div className="cv-mock-name">Adaeze Okafor</div>
              <div className="cv-mock-role">Software Engineer • Lagos, Nigeria • 08012345678</div>
              <div className="cv-mock-divider" />
              <div className="cv-mock-section">
                <div className="cv-mock-label">Career Objective</div>
                <div className="cv-mock-line w100" />
                <div className="cv-mock-line w80" />
              </div>
              <div className="cv-mock-section">
                <div className="cv-mock-label">NYSC Status</div>
                <span className="cv-mock-nysc">DISCHARGED — 2023</span>
              </div>
              <div className="cv-mock-section">
                <div className="cv-mock-label">Education</div>
                <div className="cv-mock-line w90" />
                <div className="cv-mock-line w60" />
              </div>
              <div className="cv-mock-section">
                <div className="cv-mock-label">Work Experience</div>
                <div className="cv-mock-line w100" />
                <div className="cv-mock-line w80" />
                <div className="cv-mock-line w90" />
              </div>
              <div className="cv-mock-section">
                <div className="cv-mock-label">Referees (2)</div>
                <div className="cv-mock-line w80" />
                <div className="cv-mock-line w70" style={{ width: "70%" }} />
              </div>
              <div className="cv-mock-score">
                <div className="score-ring">94</div>
                <div>
                  <div style={{ fontSize: "13px", color: "#1A1410", fontWeight: 600 }}>
                    CV Score
                  </div>
                  <div style={{ fontSize: "11px", color: "#888" }}>Excellent — ready to send</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features">
        <div className="section-label reveal">Platform features</div>
        <h2 className="section-headline reveal reveal-delay-1">
          More than just
          <br />
          a CV builder.
        </h2>

        <div className="features">
          <div className="feature reveal">
            <div className="feature-icon">📊</div>
              <div className="feature-title">CV Score Check</div>
            <div className="feature-desc">
              Get a score out of 100 before you pay. See exactly which sections are hurting you and
              fix them in seconds. Five specific improvement tips, not vague advice.
            </div>
            <span className="feature-tag">Free to check</span>
          </div>
          <div className="feature reveal reveal-delay-1">
            <div className="feature-icon">💬</div>
            <div className="feature-title">WhatsApp-Ready Image</div>
            <div className="feature-desc">
              Nigerian recruiters often ask for CVs on WhatsApp. Get a high-resolution JPG of your
              CV alongside the PDF — opens instantly on any phone, no PDF viewer needed.
            </div>
            <span className="feature-tag">Included with download</span>
          </div>
          <div className="feature reveal reveal-delay-2">
            <div className="feature-icon">💰</div>
            <div className="feature-title">Nigerian Salary Database</div>
            <div className="feature-desc">
              Anonymous salary ranges by company, role, and state. Community-submitted. GTBank,
              Dangote, MTN, Access Bank, and growing. Know what to ask for before you interview.
            </div>
            <span className="feature-tag">Free, no account needed</span>
          </div>
          <div className="feature reveal reveal-delay-3">
            <div className="feature-icon">📋</div>
            <div className="feature-title">Application Tracker</div>
            <div className="feature-desc">
              Track every job you apply to in one place. Applied, Interview, Rejected, Offer. When
              you move a card to Interview, we remind you to update your CV. Because every
              interview is a chance.
            </div>
            <span className="feature-tag">Free for all users</span>
          </div>
        </div>
      </section>

      <section
        id="pricing"
        style={{ background: "var(--off-black)", borderTop: "1px solid var(--border)" }}
      >
        <div className="section-label reveal">Simple pricing</div>
        <h2 className="section-headline reveal reveal-delay-1">
          Pay once.
          <br />
          Own your CV.
        </h2>

        <div className="pricing-grid">
          <div className="price-card reveal">
            <div className="price-tier">Free</div>
            <div className="price-amount">
              <span className="currency">₦</span>0
            </div>
            <div className="price-desc">
              Build your full CV and see your score. No payment until you&apos;re happy with what you
              see.
            </div>
            <ul className="price-features">
              <li>Full 17-step CV builder</li>
              <li>CV score out of 100</li>
              <li>5 improvement suggestions</li>
              <li>Watermarked preview</li>
              <li>Salary database access</li>
              <li>Application tracker</li>
            </ul>
            <Link href="/build" className="price-btn">
              Start building free
            </Link>
          </div>
          <div className="price-card featured reveal reveal-delay-1">
            <div className="price-tier">Paid download</div>
            <div className="price-amount">
              <span className="currency">₦</span>1,500
            </div>
            <div className="price-desc">
              One-time payment. Remove watermark, get your PDF and WhatsApp image. Yours to keep
              forever.
            </div>
            <ul className="price-features">
              <li>Everything in free</li>
              <li>Clean PDF download</li>
              <li>WhatsApp-ready JPG</li>
              <li>AI-polished objective</li>
              <li>Delivered to your inbox</li>
              <li>Edit free, re-download ₦500</li>
            </ul>
            <Link href="/build" className="price-btn">
              Get my CV now
            </Link>
          </div>
        </div>

        <div className="payment-badges reveal" style={{ marginTop: "32px", justifyContent: "flex-start" }}>
          <div className="badge">
            <span className="dot" /> Card payment
          </div>
          <div className="badge">
            <span className="dot" /> Bank transfer
          </div>
          <div className="badge">
            <span className="dot" /> USSD (*737# etc)
          </div>
          <div className="badge">
            <span className="dot" /> Secured by Paystack
          </div>
        </div>
      </section>

      <section>
        <div className="section-label reveal">Early users</div>
        <h2 className="section-headline reveal reveal-delay-1">What Nigerians say.</h2>

        <div className="testimonials">
          <div className="testimonial reveal">
            <p className="testimonial-text">
              Finally a CV tool that knows I need to include my NYSC status and two referees.
              Every other tool I tried left those out and I had to fix it manually.
            </p>
            <div className="testimonial-author">
              <div
                className="author-avatar"
                style={{ background: "rgba(0,230,118,0.15)", color: "var(--green)" }}
              >
                AO
              </div>
              <div>
                <div className="author-name">Adaeze O.</div>
                <div className="author-role">NYSC corper · Rivers State</div>
              </div>
            </div>
          </div>
          <div className="testimonial reveal reveal-delay-1">
            <p className="testimonial-text">
              I paid ₦1,500 and had my CV in my inbox in under 10 minutes. The WhatsApp image was
              a genius addition — my recruiter actually asked me to send it that way.
            </p>
            <div className="testimonial-author">
              <div
                className="author-avatar"
                style={{ background: "rgba(255,107,53,0.15)", color: "var(--orange)" }}
              >
                TK
              </div>
              <div>
                <div className="author-name">Tunde K.</div>
                <div className="author-role">Graduate trainee applicant · Lagos</div>
              </div>
            </div>
          </div>
          <div className="testimonial reveal reveal-delay-2">
            <p className="testimonial-text">
              My CV scored 61 the first time. The tips told me exactly what to fix — added my NYSC
              year and two more skills. Scored 88 on the second check. Got called for an interview
              that same week.
            </p>
            <div className="testimonial-author">
              <div
                className="author-avatar"
                style={{ background: "rgba(124,77,255,0.15)", color: "#B39DDB" }}
              >
                CI
              </div>
              <div>
                <div className="author-name">Chisom I.</div>
                <div className="author-role">Entry-level accountant · Enugu</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2 className="cta-headline reveal">
          Your next job starts
          <br />
          with the right CV.
        </h2>
        <p className="cta-sub reveal reveal-delay-1">Build yours in 8 minutes. Free to start.</p>
        <div className="reveal reveal-delay-2">
          <Link href="/build" className="btn-primary" style={{ fontSize: "17px", padding: "20px 40px" }}>
            Build my Nigerian CV — it&apos;s free <span className="arrow">&rarr;</span>
          </Link>
        </div>
        <div className="payment-badges reveal reveal-delay-3">
          <div className="badge">
            <span className="dot" /> No account needed to start
          </div>
          <div className="badge">
            <span className="dot" /> Progress saved automatically
          </div>
          <div className="badge">
            <span className="dot" /> Works on any Nigerian phone
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-logo">
          CV<span>Padi</span>
        </div>
        <ul className="footer-links">
          <li>
            <Link href="/check">Check my CV</Link>
          </li>
          <li>
            <Link href="/salary">Salary database</Link>
          </li>
          <li>
            <Link href="/nysc">NYSC hub</Link>
          </li>
          <li>
            <Link href="/dashboard">Dashboard</Link>
          </li>
        </ul>
        <div className="footer-copy">© 2026 CVPadi · Made for Nigeria</div>
      </footer>
    </>
  );
}




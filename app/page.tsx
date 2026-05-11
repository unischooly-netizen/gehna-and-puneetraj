'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const MEMORY_IMAGES = [
  '/images/carousel-1.png',
  '/images/carousel-2.png',
  '/images/carousel-3.png',
  '/images/carousel-4.png',
  '/images/carousel-5.png',
  '/images/carousel-6.png',
  '/images/carousel-7.png',
  '/images/carousel-8.png',
  '/images/carousel-9.png',
  '/images/carousel-10.png',
];

export default function WeddingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const entryVideoRef = useRef<HTMLVideoElement>(null);

  const [gateVisible, setGateVisible] = useState(true);
  const [gateFading, setGateFading] = useState(false);
  const [mainVisible, setMainVisible] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [petalsActive, setPetalsActive] = useState(false);
  const [countdown, setCountdown] = useState({ d: '00', h: '00', m: '00', s: '00', done: false });
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; type: 'success' | 'error' }>({ open: false, type: 'success' });
  const [declining, setDeclining] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const mainRevealedRef = useRef(false);
  const carouselTouchStartX = useRef<number | null>(null);

  // --- Body overflow ---
  useEffect(() => {
    document.body.style.overflow = mainVisible ? 'auto' : 'hidden';
  }, [mainVisible]);

  // --- Petals Canvas Animation ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const COLORS = ['#D4806A', '#E8C07A', '#C9963E', '#B85940', '#EEDDD3', '#F5E4C0'];
    const COUNT = window.innerWidth < 600 ? 28 : 52;

    class Petal {
      x = 0; y = 0; r = 0; vx = 0; vy = 0;
      rot = 0; drot = 0; color = ''; alpha = 0;

      constructor(initial: boolean) { this.reset(initial); }

      reset(initial: boolean) {
        this.x = Math.random() * canvas!.width;
        this.y = initial ? Math.random() * canvas!.height * 2 - canvas!.height : -20;
        this.r = 4 + Math.random() * 5;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = 0.6 + Math.random() * 1.2;
        this.rot = Math.random() * Math.PI * 2;
        this.drot = (Math.random() - 0.5) * 0.04;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.alpha = 0.5 + Math.random() * 0.4;
      }

      update() {
        this.x += this.vx + Math.sin(this.y * 0.01) * 0.4;
        this.y += this.vy;
        this.rot += this.drot;
        if (this.y > canvas!.height + 20) this.reset(false);
      }

      draw() {
        ctx!.save();
        ctx!.translate(this.x, this.y);
        ctx!.rotate(this.rot);
        ctx!.globalAlpha = this.alpha;
        ctx!.fillStyle = this.color;
        ctx!.beginPath();
        ctx!.ellipse(0, 0, this.r * 0.55, this.r, 0, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }
    }

    const petals: Petal[] = [];
    for (let i = 0; i < COUNT; i++) petals.push(new Petal(true));

    function loop() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      petals.forEach(p => { p.update(); p.draw(); });
      animId = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // --- Reveal main content ---
  const revealMain = useCallback(() => {
    if (mainRevealedRef.current) return;
    mainRevealedRef.current = true;
    setGateFading(true);
    setTimeout(() => setGateVisible(false), 900);
    setMainVisible(true);
    setPetalsActive(true);
  }, []);

  // --- Entry video ended/error handlers ---
  useEffect(() => {
    const video = entryVideoRef.current;
    if (!video) return;

    const handleEnded = () => revealMain();
    const handleError = () => {
      if (!mainRevealedRef.current) setTimeout(revealMain, 500);
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [revealMain]);

  // --- Countdown ---
  useEffect(() => {
    if (!mainVisible) return;
    const target = new Date('July 1, 2026 09:00:00 GMT+0530').getTime();

    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) {
        setCountdown({ d: '00', h: '00', m: '00', s: '00', done: true });
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const fmt = (n: number) => String(n).padStart(2, '0');
      setCountdown({ d: fmt(d), h: fmt(h), m: fmt(m), s: fmt(s), done: false });
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [mainVisible]);

  // --- Scroll reveal ---
  useEffect(() => {
    if (!mainVisible) return;
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [mainVisible]);

  // --- Event video auto-expand ---
  useEffect(() => {
    if (!mainVisible) return;
    const wraps = document.querySelectorAll('.event-video-wrap');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('unlocked');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });
    wraps.forEach(w => io.observe(w));
    return () => io.disconnect();
  }, [mainVisible]);

  // --- Carousel autoplay ---
  useEffect(() => {
    if (!mainVisible) return;
    const interval = setInterval(() => {
      setCarouselIndex(i => (i + 1) % MEMORY_IMAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [mainVisible]);

  const prevSlide = useCallback(() =>
    setCarouselIndex(i => (i - 1 + MEMORY_IMAGES.length) % MEMORY_IMAGES.length), []);
  const nextSlide = useCallback(() =>
    setCarouselIndex(i => (i + 1) % MEMORY_IMAGES.length), []);

  const handleCarouselTouchStart = (e: React.TouchEvent) => {
    carouselTouchStartX.current = e.touches[0].clientX;
  };
  const handleCarouselTouchEnd = (e: React.TouchEvent) => {
    if (carouselTouchStartX.current === null) return;
    const diff = carouselTouchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? nextSlide() : prevSlide(); }
    carouselTouchStartX.current = null;
  };

  // --- Gate click handler ---
  const handleGateClick = async () => {
    if (mainRevealedRef.current) return;
    const video = entryVideoRef.current;
    if (!video || !video.paused) return;
    try {
      video.muted = false;
      await video.play();
      try {
        await audioRef.current?.play();
        setAudioPlaying(true);
      } catch { /* ignore */ }
    } catch (e) {
      console.warn('Video play blocked:', e);
    }
  };

  // --- Audio toggle ---
  const toggleAudio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (audioPlaying) {
      audio.pause();
      setAudioPlaying(false);
    } else {
      try {
        await audio.play();
        setAudioPlaying(true);
      } catch (err) { console.warn(err); }
    }
  };

  // --- RSVP submit (direct Google Forms POST, no-cors) ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;

    const GOOGLE_FORM_URL =
      'https://docs.google.com/forms/d/e/1FAIpQLSf9x7l2z6Snx6GCY5FftyIuf_6o2-LfpqW0X_Ji0sXVW7SdOQ/formResponse';

    const params = new URLSearchParams();
    params.append('entry.857192818',  (fd.get('name') as string) ?? '');
    params.append('entry.811463742',  (fd.get('phone') as string) ?? '');
    params.append('entry.490595501',  (fd.get('attending') as string) ?? '');
    params.append('entry.1092411044', (fd.get('guest_count') as string) ?? '');
    fd.getAll('attending_events').forEach(v => params.append('entry.1862080015', v as string));
    params.append('entry.1347686639', (fd.get('guess_emotional_first') as string) ?? '');
    params.append('entry.1948185072', (fd.get('wedding_mood') as string) ?? '');
    params.append('entry.1876987010', (fd.get('advice_for_forever') as string) ?? '');
    params.append('entry.858860455',  (fd.get('message') as string) ?? '');

    try {
      // mode:'no-cors' is required — Google Forms doesn't set CORS headers.
      // The response will be opaque (unreadable) but Google still records the submission.
      await fetch(GOOGLE_FORM_URL, {
        method: 'POST',
        body: params.toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        mode: 'no-cors',
      });
      setModal({ open: true, type: 'success' });
      form.reset();
    } catch {
      setModal({ open: true, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => setModal({ ...modal, open: false });

  const extraCardStyle = declining
    ? { opacity: 0.4, pointerEvents: 'none' as const }
    : {};

  return (
    <>
      {/* Petals Canvas */}
      <canvas
        ref={canvasRef}
        id="petals-canvas"
        className={petalsActive ? 'active' : ''}
      />

      {/* Background Audio */}
      <audio ref={audioRef} id="bg-audio" loop preload="metadata">
        <source
          src="https://pub-1953a6673e864f3488c645252f75de98.r2.dev/Ashish%20%26%20Ayushi/Jashn-E-Bahaaraa%20(Instrumental%20-%20Flute)%20%5B-2w18bd-ZQ4%5D.mp3"
          type="audio/mpeg"
        />
      </audio>

      {/* Audio Toggle Button */}
      <button id="audio-btn" title="Toggle music" aria-label="Toggle background music" onClick={toggleAudio}>
        <svg
          id="icon-on"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
          style={audioPlaying ? {} : { display: 'none' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"
          />
        </svg>
        <svg
          id="icon-off"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
          style={audioPlaying ? { display: 'none' } : {}}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"
          />
        </svg>
      </button>

      {/* Entry Gate */}
      {gateVisible && (
        <div
          id="entry-gate"
          className={gateFading ? 'fade-out' : ''}
          onClick={handleGateClick}
        >
          <video ref={entryVideoRef} playsInline preload="auto" muted poster='/images/poster-opening.png'>
            <source
              src="/card-opening.mp4"
              type="video/mp4"
            />
          </video>
        </div>
      )}

      {/* Main Content */}
      <div id="main-content" className={mainVisible ? 'visible fade-in' : ''}>

        {/* ==================== HERO ==================== */}
        <section id="hero">
          <video id="hero-bg-video" autoPlay loop muted playsInline>
            <source
              src="https://pub-1953a6673e864f3488c645252f75de98.r2.dev/common-assets/Background.mp4"
              type="video/mp4"
            />
          </video>

          <div className="hero-frame"><span></span></div>

          <div className="hero-card">
            <div className="card-corner tl"></div>
            <div className="card-corner tr"></div>
            <div className="card-corner bl"></div>
            <div className="card-corner br"></div>

            <img
              className="ganesh-icon"
              src="https://pub-1953a6673e864f3488c645252f75de98.r2.dev/Shriya%20%26%20Ashutosh/Vianyak%20png.png"
              alt="Shri Ganesh"
            />
            <p
              style={{
                fontFamily: "'Tenor Sans',sans-serif",
                fontSize: '0.62rem',
                letterSpacing: '0.3em',
                color: 'var(--terracotta)',
                textTransform: 'uppercase',
                marginBottom: '1.25rem',
              }}
            >
              || श्री गणेशाय नमः ||
              <br />
              वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ
              <br />
              निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा
            </p>

            <p className="blessings-text">
              With the grace of God &amp; Blessings of
              <br />
              our grandparents, 
              <br /><br />
              We joyfully request your gracious presence on the wedding celebration of
            </p>

            <div className="couple-block">
              <span className="couple-name shimmer-gold">Puneetraj</span>
              <p className="family-line">Son of Shri Yashwant Choudhary &amp; Smt. Tanuja Choudhary</p>
              <p className="family-subline">(Grandson of Shree K.M. Choudhary &amp; Smt. Sunanda Choudhary)</p>
            </div>

            <div className="ampersand-wrap">
              <div className="ampersand-line"></div>
              <span className="ampersand">&amp;</span>
              <div className="ampersand-line"></div>
            </div>

            <div className="couple-block">
              <span className="couple-name shimmer-gold">Gehna</span>
              <p className="family-line">Daughter of Shree Pranav Bhatnagar &amp; Smt. Sheetal Bhatnagar</p>
              <p className="family-subline">(Granddaughter of Smt. Lily Bhatnagar &amp; Late Shree R.K. Bhatnagar )</p>
            </div>
          </div>

          <div className="scroll-cue">
            <p>Scroll</p>
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </section>

        {/* ==================== COUNTDOWN ==================== */}
        <section id="countdown-section">
          <div className="countdown-card reveal">
            <span className="section-label">The Big Day</span>
            <p className="countdown-quote">The start of a beautiful journey, shared with the ones we love most</p>
            <p className="countdown-date">Wednesday · 1st July 2026</p>

            <div className="countdown-grid">
              {countdown.done ? (
                <p
                  style={{
                    gridColumn: '1/-1',
                    fontFamily: '"Great Vibes",cursive',
                    fontSize: '3rem',
                    color: 'var(--terracotta)',
                  }}
                >
                  {"We're Married!"}
                </p>
              ) : (
                <>
                  <div className="countdown-unit">
                    <span className="countdown-number">{countdown.d}</span>
                    <span className="countdown-label">Days</span>
                  </div>
                  <div className="countdown-unit">
                    <span className="countdown-number">{countdown.h}</span>
                    <span className="countdown-label">Hours</span>
                  </div>
                  <div className="countdown-unit">
                    <span className="countdown-number">{countdown.m}</span>
                    <span className="countdown-label">Mins</span>
                  </div>
                  <div className="countdown-unit">
                    <span className="countdown-number">{countdown.s}</span>
                    <span className="countdown-label">Secs</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ==================== MEMORIES ==================== */}
        <section id="memories-section">
          <div className="text-center reveal">
            <span className="section-label">A Glimpse of Us</span>
            <h2 className="section-heading" style={{ color: 'var(--terracotta)' }}>
              Our Beautiful<br />Moments
            </h2>
            <div className="ornament mt-4">
              <div className="ornament-line rev"></div>
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--gold)' }}>
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
              </svg>
              <div className="ornament-line"></div>
            </div>
          </div>

          <div
            className="memories-frame reveal reveal-delay-2"
            onTouchStart={handleCarouselTouchStart}
            onTouchEnd={handleCarouselTouchEnd}
          >
            <div className="memories-inner">
              <div
                className="carousel-track"
                style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
              >
                {MEMORY_IMAGES.map((src, i) => (
                  <div key={i} className="carousel-slide">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`carousel-${i + 1}`} />
                  </div>
                ))}
              </div>
              <button
                className="carousel-btn prev"
                onClick={prevSlide}
                aria-label="Previous photo"
              >&#8249;</button>
              <button
                className="carousel-btn next"
                onClick={nextSlide}
                aria-label="Next photo"
              >&#8250;</button>
              <div className="carousel-dots">
                {MEMORY_IMAGES.map((_, i) => (
                  <button
                    key={i}
                    className={`carousel-dot${i === carouselIndex ? ' active' : ''}`}
                    onClick={() => setCarouselIndex(i)}
                    aria-label={`Go to photo ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <p
            className="text-center reveal reveal-delay-3 mt-8"
            style={{ fontStyle: 'italic', color: 'var(--text-light)', fontSize: '1.1rem' }}
          >
            A moment captured in time, forever in our hearts
          </p>
        </section>

        {/* ==================== VENUE ==================== */}
        <section id="venue-section">
          <div className="text-center reveal">
            <span className="section-label">Where Love Awaits</span>
            <h2 className="section-heading" style={{ color: 'var(--terracotta)' }}>
              Our Cherished<br />Venue
            </h2>
            <div className="ornament mt-4 mb-8">
              <div className="ornament-line rev"></div>
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--gold)' }}>
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
              </svg>
              <div className="ornament-line"></div>
            </div>
          </div>

          <div className="venue-card reveal reveal-delay-2">
            {/* TODO: Replace /venue.jpg with your venue image in public/ folder */}
            <img
              className="venue-img"
              src="/venue.png"
              alt="Umang Garden and Resort"
            />
            <div className="venue-info text-center">
              <h3 className="venue-name">Umang Garden &amp; Resort</h3>
              <p className="venue-address">
                Near Khajurikalan Square, Khajurikalan,<br />
                By Pass Road, Bhopal (M.P.) — 462022
              </p>
              <iframe
                className="venue-map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3666.5!2d77.5114!3d23.2373!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x397c41152f9d5adb%3A0x87da587152d5de44!2sUmang%20Garden%20and%20Resort!5e0!3m2!1sen!2sin!4v1680000000000!5m2!1sen!2sin"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Umang Garden and Resort Map"
              />
              <br />
              <a
                className="directions-btn"
                href="https://www.google.com/maps/dir//Umang+Garden+and+Resort,+Khajurikala,+Bhopal,+Madhya+Pradesh+462022,+India"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Directions
              </a>
            </div>
          </div>
        </section>

        {/* ==================== EVENTS ==================== */}
        <section id="events-section">
          <div className="text-center reveal" style={{ marginBottom: '3rem' }}>
            <span className="section-label">The Celebration Unfolds</span>
            <h2 className="section-heading" style={{ color: 'var(--terracotta)' }}>
              Six Sacred<br />Ceremonies
            </h2>
            <div className="ornament mt-4">
              <div className="ornament-line rev"></div>
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--gold)' }}>
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
              </svg>
              <div className="ornament-line"></div>
            </div>
          </div>

          {/* Event I — Mehendi */}
          <div className="event-block reveal">
            <div className="text-center mb-4">
              <p className="event-subtitle">Ceremony I · Monday, 29th June 2026 · 6:00 PM</p>
              <h3 className="event-title">Mehendi Ceremony</h3>
              <p style={{ fontStyle: 'italic', color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Venue: Effotel by Sayaji &amp; Bhopal
              </p>
            </div>
            <div className="event-video-wrap">
              <video autoPlay muted loop playsInline>
                <source
                  src="./mehendi.mp4"
                  type="video/mp4"
                />
              </video>
            </div>
          </div>
          <div className="event-sep reveal"><div className="event-sep-line"></div><div className="event-sep-dot"></div><div className="event-sep-line"></div></div>

          {/* Event II — Haldi */}
          <div className="event-block reveal">
            <div className="text-center mb-4">
              <p className="event-subtitle">Ceremony II · Tuesday, 30th June 2026 · 11:00 AM</p>
              <h3 className="event-title">Haldi Ceremony</h3>
              <p style={{ fontStyle: 'italic', color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Venue: Umang Garden &amp; Resort
              </p>
            </div>
            <div className="event-video-wrap">
              <video autoPlay muted loop playsInline>
                <source
                  src="./haldi.mp4"
                  type="video/mp4"
                />
              </video>
            </div>
          </div>
          <div className="event-sep reveal"><div className="event-sep-line"></div><div className="event-sep-dot"></div><div className="event-sep-line"></div></div>

          {/* Event III — Ring Ceremony */}
          <div className="event-block reveal">
            <div className="text-center mb-4">
              <p className="event-subtitle">Ceremony III · Tuesday, 30th June 2026 · 6:00 PM</p>
              <h3 className="event-title">Ring Ceremony</h3>
              <p style={{ fontStyle: 'italic', color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Venue: Umang Garden &amp; Resort
              </p>
            </div>
            <div className="event-video-wrap">
              <video autoPlay muted loop playsInline>
                <source
                  src="./ring.mp4"
                  type="video/mp4"
                />
              </video>
            </div>
          </div>
          <div className="event-sep reveal"><div className="event-sep-line"></div><div className="event-sep-dot"></div><div className="event-sep-line"></div></div>

          {/* Event IV — Sangeet */}
          <div className="event-block reveal">
            <div className="text-center mb-4">
              <p className="event-subtitle">Ceremony IV · Tuesday, 30th June 2026 · 7:00 PM</p>
              <h3 className="event-title">Sangeet Night</h3>
              <p style={{ fontStyle: 'italic', color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Venue: Umang Garden &amp; Resort
              </p>
            </div>
            <div className="event-video-wrap">
              <video autoPlay muted loop playsInline>
                <source
                  src="./sangeet.mp4"
                  type="video/mp4"
                />
              </video>
            </div>
          </div>
          <div className="event-sep reveal"><div className="event-sep-line"></div><div className="event-sep-dot"></div><div className="event-sep-line"></div></div>

          {/* Event V — Wedding */}
          <div className="event-block reveal">
            <div className="text-center mb-4">
              <p className="event-subtitle">Ceremony V · Wednesday, 1st July 2026 · 9:00 AM</p>
              <h3 className="event-title">Shubh Vivah</h3>
              <p style={{ fontStyle: 'italic', color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Venue: Umang Garden &amp; Resort
              </p>
            </div>
            <div className="event-video-wrap">
              <video autoPlay muted loop playsInline>
                <source
                  src="./wedding.mp4"
                  type="video/mp4"
                />
              </video>
            </div>
          </div>
          <div className="event-sep reveal"><div className="event-sep-line"></div><div className="event-sep-dot"></div><div className="event-sep-line"></div></div>

          {/* Event VI — Reception */}
          <div className="event-block reveal">
            <div className="text-center mb-4">
              <p className="event-subtitle">Ceremony VI · Wednesday, 1st July 2026 · 7:00 PM Onwards</p>
              <h3 className="event-title">Reception &amp; Dinner</h3>
              <p style={{ fontStyle: 'italic', color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Venue: Umang Garden &amp; Resort
              </p>
            </div>
            <div className="event-video-wrap">
              <video autoPlay muted loop playsInline>
                <source
                  src="./reception-night.mp4"
                  type="video/mp4"
                />
              </video>
            </div>
          </div>
        </section>

        {/* ==================== RSVP ==================== */}
        <section id="rsvp-section">
          <div className="text-center reveal">
            <span className="section-label">Join the Celebration</span>
            <h2 className="section-heading" style={{ color: 'var(--terracotta)' }}>
              Celebrate<br />With Us
            </h2>
            <p
              className="reveal reveal-delay-2 mt-4"
              style={{ fontStyle: 'italic', color: 'var(--text-light)', fontSize: '1.1rem', marginBottom: '2.5rem' }}
            >
              A few fun questions before the big day!
            </p>
          </div>

          <form id="rsvp-form" className="rsvp-form" onSubmit={handleSubmit}>

            {/* Guest Details */}
            <div className="form-card reveal">
              <p className="form-card-title">Guest Details</p>
              <div className="field-group">
                <label className="field-label" htmlFor="f-name">Your Name</label>
                <input className="field-input" type="text" id="f-name" name="name" required placeholder="Full name" />
              </div>
              <div className="field-group" style={{ marginBottom: 0 }}>
                <label className="field-label" htmlFor="f-phone">Phone Number</label>
                <input className="field-input" type="tel" id="f-phone" name="phone" required placeholder="+91 00000 00000" />
              </div>
            </div>

            {/* Attending */}
            <div className="form-card reveal reveal-delay-1">
              <p className="form-card-title">Will you join us?</p>
              <div className="radio-pill-row">
                <label className="radio-pill">
                  <input
                    type="radio"
                    name="attending"
                    value="Yes"
                    defaultChecked
                    onChange={() => setDeclining(false)}
                  />
                  Joyfully Accept 🎉
                </label>
                <label className="radio-pill">
                  <input
                    type="radio"
                    name="attending"
                    value="No"
                    onChange={() => setDeclining(true)}
                  />
                  Regretfully Decline
                </label>
              </div>
            </div>

            {/* Party Size */}
            <div className="form-card reveal reveal-delay-1" style={extraCardStyle}>
              <p className="form-card-title">Party Size</p>
              <p className="form-card-subtitle">Including yourself, how many guests?</p>
              <div className="field-group" style={{ marginBottom: 0 }}>
                <select className="field-input" name="guest_count" required>
                  <option value="1">1 (Just me)</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                  <option value="5">5 Guests</option>
                  <option value="6+">6+ Guests</option>
                </select>
              </div>
            </div>

            {/* Events */}
            <div className="form-card reveal reveal-delay-1" style={extraCardStyle}>
              <p className="form-card-title">Events You&apos;ll Attend</p>
              <p className="form-card-subtitle">Select the days you will be joining us</p>
              <div className="checkbox-row">
                <label className="checkbox-pill">
                  <div>
                    <span>Day 1: Mehendi Ceremony</span>
                    <small className="checkbox-date">Monday, 29th June 2026</small>
                  </div>
                  <input type="checkbox" name="attending_events" value="Day 1: Haldi, Ring Ceremony, Sangeet" />
                </label>
                <label className="checkbox-pill">
                  <div>
                    <span>Day 2: Haldi, Ring Ceremony &amp; Sangeet</span>
                    <small className="checkbox-date">Tuesday, 30th June 2026</small>
                  </div>
                  <input type="checkbox" name="attending_events" value="Day 2: Marriage and Reception" />
                </label>
                <label className="checkbox-pill">
                  <div>
                    <span>Day 3: Wedding &amp; Reception</span>
                    <small className="checkbox-date">Wednesday, 1st July 2026</small>
                  </div>
                  <input type="checkbox" name="attending_events" value="Both" />
                </label>
              </div>
            </div>

            {/* Emotional Guess */}
            <div className="form-card reveal reveal-delay-1" style={extraCardStyle}>
              <p className="form-card-title">Make a Guess</p>
              <p className="form-card-subtitle">Who will get emotional first?</p>
              <div className="circle-select">
                <label className="circle-opt">
                  <input type="radio" name="guess_emotional_first" value="Gehna" />
                  <div className="circle-face">S</div>
                  <span className="circle-opt-label">Gehna</span>
                </label>
                <label className="circle-opt">
                  <input type="radio" name="guess_emotional_first" value="Puneetraj" />
                  <div className="circle-face">P</div>
                  <span className="circle-opt-label">Puneetraj</span>
                </label>
                <label className="circle-opt">
                  <input type="radio" name="guess_emotional_first" value="Both" />
                  <div className="circle-face">B</div>
                  <span className="circle-opt-label">Both</span>
                </label>
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-light)', fontStyle: 'italic', marginTop: '1rem' }}>
                Reveal after the wedding 😉
              </p>
            </div>

            {/* Wedding Mood */}
            <div className="form-card reveal reveal-delay-2" style={extraCardStyle}>
              <p className="form-card-title">Your Wedding Mood</p>
              <p className="form-card-subtitle">{"I'm coming for..."}</p>
              <div className="mood-grid">
                <label className="mood-opt"><input type="radio" name="wedding_mood" value="The Food" /> The Food 🍛</label>
                <label className="mood-opt"><input type="radio" name="wedding_mood" value="The Dance Floor" /> Dance Floor 💃</label>
                <label className="mood-opt"><input type="radio" name="wedding_mood" value="The Love" /> The Love ❤️</label>
                <label className="mood-opt"><input type="radio" name="wedding_mood" value="All of it" /> All of It ✨</label>
              </div>
            </div>

            {/* Note */}
            <div className="form-card reveal reveal-delay-2">
              <p className="form-card-title">Leave Us a Note</p>
              <p className="form-card-subtitle">Share a wish or memory.</p>
              <textarea className="text-area" name="message" rows={3} placeholder="Write something from the heart..." />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontStyle: 'italic', marginTop: '0.6rem' }}>
                🔥 This becomes a digital memory book.
              </p>
            </div>

            {/* Advice */}
            <div className="form-card reveal reveal-delay-3">
              <p className="form-card-title">Words for Forever</p>
              <p className="form-card-subtitle">Advice for married life.</p>
              <textarea className="text-area" name="advice_for_forever" rows={3} placeholder="One piece of advice..." />
            </div>

            {/* Submit */}
            <div className="reveal reveal-delay-3" style={{ marginTop: '2rem' }}>
              <button type="submit" className="submit-btn" disabled={submitting}>
                <span>{submitting ? 'Sending...' : 'Send Love'}</span>
                {submitting && (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="spin"
                    style={{ verticalAlign: 'middle', marginLeft: '8px', display: 'inline' }}
                  >
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0110 10" strokeOpacity="0.75" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* ==================== FOOTER ==================== */}
        <section id="footer-section">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }} className="reveal">
            <span
              style={{
                fontFamily: "'Great Vibes',cursive",
                fontSize: '4rem',
                color: 'var(--gold-light)',
                display: 'block',
                lineHeight: '1.1',
              }}
            >
              Puneetraj &amp; Gehna
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                marginTop: '1rem',
                opacity: 0.4,
              }}
            >
              <div style={{ height: '1px', width: '60px', background: 'var(--gold-light)' }}></div>
              <span style={{ color: 'var(--gold-light)', fontSize: '1.1rem' }}>♥</span>
              <div style={{ height: '1px', width: '60px', background: 'var(--gold-light)' }}></div>
            </div>
          </div>

          <div className="footer-grid">
            <div className="reveal">
              <span className="footer-heading">Compliments &amp; Love From</span>
              <ul className="footer-list">
                <li>Prajakta</li>
                <li>Harshal &amp; Priyanka</li>
                <li>Amit &amp; Anushree</li>
                <li>Gaurav &amp; Akanksha</li>
                <li>Sourabh</li>
              </ul>
            </div>

            <div className="reveal reveal-delay-2">
              <span className="footer-heading">RSVP</span>
              <div className="footer-rsvp-names">
                <p>Shree Pramod Choudhary &amp; Smt. Jayshree Choudhary</p>
                <p>Shree Sunil Choudhary &amp; Sushma Choudhary</p>
              </div>
            </div>
            </div>

          <br /><br />
          <div className='text-align-center'>
            <a
            href="https://www.instagram.com/whoPuneetraj/"
            target="_blank"
            rel="noopener noreferrer"
            className="insta-handle"
          >
            Created with ♥ by Puneetraj.
          </a>
          </div>
        </section>
      </div>

      {/* ==================== MODAL ==================== */}
      <div id="rsvp-modal" className={modal.open ? 'open' : ''} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="modal-card">
          <div
            className="modal-icon-ring"
            style={{ background: modal.type === 'success' ? 'rgba(184,89,64,0.1)' : 'rgba(220,38,38,0.08)' }}
          >
            {modal.type === 'success' ? (
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: '#dc2626' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h3 className="modal-title">Thank You!</h3>
          <p className="modal-msg">
               We can't wait to celebrate with you on our special day!
          </p>
          <button className="modal-close-btn" onClick={closeModal}>Close</button>
        </div>
      </div>
    </>
  );
}

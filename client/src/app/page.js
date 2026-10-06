"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PRICE = 100;
const TEST_CODE = "482917";
const DEFAULT_STATUS =
  "Try it: tap a free locker. This is a demo. Real lockers open after payment and a one-time code.";

const initialLockers = { 1: "free", 2: "free", 3: "used", 4: "free" };

function money(n) {
  return `Rs.${Number(n).toLocaleString("en-US")}`;
}

function hrs(h) {
  return `${h}${h === 1 ? " hour" : " hours"}`;
}

function pad(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

function fmt(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function endLabel(h) {
  const end = new Date(Date.now() + h * 3600000);
  const same = end.toDateString() === new Date().toDateString();

  return end.toLocaleString(
    [],
    same
      ? { hour: "numeric", minute: "2-digit" }
      : { weekday: "short", hour: "numeric", minute: "2-digit" },
  );
}

function Icon({ id, size = 20 }) {
  return (
    <svg width={size} height={size} aria-hidden="true">
      <use href={`#${id}`} />
    </svg>
  );
}

function Logo({ className = "brand" }) {
  return (
    <span className={className}>
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <rect x="1" y="1" width="11" height="11" rx="2" fill="currentColor" />
        <rect x="14" y="1" width="11" height="11" rx="2" fill="currentColor" />
        <rect x="1" y="14" width="11" height="11" rx="2" fill="currentColor" />
        <rect
          x="14"
          y="14"
          width="11"
          height="11"
          rx="2"
          fill="var(--signal)"
        />
      </svg>

      <span className="brand-t">SmartRent PK</span>
    </span>
  );
}

function SvgDefs() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute" }}
      aria-hidden="true"
    >
      <symbol id="ck" viewBox="0 0 20 20">
        <circle
          cx="10"
          cy="10"
          r="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M5.8 10.4l2.8 2.8 5.6-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </symbol>

      <symbol id="pd" viewBox="0 0 20 20">
        <circle
          cx="10"
          cy="10"
          r="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeDasharray="3 3"
        />
      </symbol>

      <symbol id="wn" viewBox="0 0 20 20">
        <path
          d="M10 2.5l8 14H2z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M10 8v4M10 14.2v.1"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </symbol>
    </svg>
  );
}

function LockerMachine({
  lockers,
  selected,
  screen,
  onLockerClick,
  statusText,
}) {
  return (
    <div className="machine">
      <div
        className="cabinet"
        role="group"
        aria-label="Demo locker machine"
      >
        <div className="plate">
          <span>SmartRent PK</span>

          <span>
            <i className="dot" />
            Machine 01 online
          </span>
        </div>

        {[1, 2, 3, 4].map((n) => {
          const st = lockers[n];
          const used = st === "used";
          const open = st === "open";
          const isSelected = selected === n && !used;

          return (
            <div
              className={`cell ${used ? "used" : ""} ${
                open ? "open" : ""
              } ${isSelected ? "sel" : ""}`}
              data-n={n}
              key={n}
            >
              <div className="inside">
                <div className="parcel" />
              </div>

              <button
                className="door"
                type="button"
                aria-label={`Locker ${n}${
                  used
                    ? ", in use"
                    : open
                      ? ", open. Close it"
                      : ", free. Open it"
                }`}
                aria-expanded={open ? "true" : "false"}
                aria-disabled={used ? "true" : undefined}
                onClick={() => onLockerClick(n)}
              >
                <span
                  className={`led ${st !== "free" ? "busy" : ""}`}
                />

                <span className="num">{n}</span>

                <span className="state">
                  {open ? "Open" : used ? "In use" : "Free"}
                </span>

                <span className="handle" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="status" aria-live="polite">
        <Icon id="ck" size={18} />
        <span>{statusText}</span>
      </div>

      {selected && (screen === "pick" || screen === "time") ? (
        <button
          className="btn full"
          type="button"
          style={{ marginTop: 6 }}
          onClick={() => {
            window.location.hash = "#/rent";
          }}
        >
          Rent locker {selected}
        </button>
      ) : null}
    </div>
  );
}

function HeroBackground() {
  const [cells, setCells] = useState([]);
  const bgRef = useRef(null);
  const activeTimers = useRef([]);

  useEffect(() => {
    const build = () => {
      const hero = document.querySelector(".hero");

      if (!hero) return;

      const cols = Math.ceil(hero.clientWidth / 76);
      const rows = Math.ceil(hero.clientHeight / 76);

      setCells(
        Array.from(
          { length: Math.max(1, cols * rows) },
          (_, i) => i,
        ),
      );
    };

    build();

    let resizeTimer;

    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 200);
    };

    window.addEventListener("resize", onResize);

    const hero = document.querySelector(".hero");

    const onPointerMove = (e) => {
      const bg = bgRef.current;

      if (!hero || !bg) return;

      const rect = hero.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      bg.style.setProperty("--mx", `${x}px`);
      bg.style.setProperty("--my", `${y}px`);

      const colsNow = Math.ceil(rect.width / 76);
      const rowsNow = Math.ceil(rect.height / 76);

      const col = Math.floor(
        x / (rect.width / colsNow),
      );

      const row = Math.floor(
        y / (rect.height / rowsNow),
      );

      const node =
        bg.querySelectorAll(".lk")[row * colsNow + col];

      if (node) {
        node.classList.add("on");

        const t = setTimeout(
          () => node.classList.remove("on"),
          1400,
        );

        activeTimers.current.push(t);
      }
    };

    hero?.addEventListener("pointermove", onPointerMove);

    return () => {
      window.removeEventListener("resize", onResize);
      hero?.removeEventListener("pointermove", onPointerMove);

      clearTimeout(resizeTimer);

      activeTimers.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches ||
      !cells.length
    ) {
      return undefined;
    }

    const interval = setInterval(() => {
      const chosen = new Set();

      while (chosen.size < Math.min(3, cells.length)) {
        chosen.add(
          Math.floor(Math.random() * cells.length),
        );
      }

      chosen.forEach((i) => {
        const node =
          bgRef.current?.querySelectorAll(".lk")[i];

        if (!node) return;

        node.classList.add("on");

        const t = setTimeout(
          () => node.classList.remove("on"),
          1800 + Math.random() * 1800,
        );

        activeTimers.current.push(t);
      });
    }, 500);

    return () => clearInterval(interval);
  }, [cells]);

  const cols = Math.max(
    1,
    Math.ceil(
      (typeof window !== "undefined"
        ? window.innerWidth
        : 1080) / 76,
    ),
  );

  return (
    <div
      ref={bgRef}
      className="hero-bg"
      aria-hidden="true"
    >
      <div
        className="lk-grid"
        style={{
          "--c": cols,
          "--r": Math.max(
            1,
            Math.ceil(cells.length / cols),
          ),
        }}
      >
        {cells.map((i) => (
          <div className="lk" key={i}>
            <i />
          </div>
        ))}
      </div>
    </div>
  );
}

function Home({
  lockers,
  selected,
  screen,
  statusText,
  onLockerClick,
  onSelectHours,
  hours,
  onRentFromHours,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [peek, setPeek] = useState(null);
  const [calcHours, setCalcHours] = useState(hours);

  useEffect(() => {
    setCalcHours(hours);
  }, [hours]);

  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches
    ) {
      return undefined;
    }

    const order = [1, 2, 4];
    let k = 0;

    const demo = setInterval(
      () => setPeek(order[k++ % 3]),
      2600,
    );

    const clear = setTimeout(
      () => setPeek(null),
      1150,
    );

    return () => {
      clearInterval(demo);
      clearTimeout(clear);
    };
  }, []);

  const total = calcHours * PRICE;

  return (
    <div id="view-home">
      <header className="nav">
        <div className="wrap">
          <a
            className="brand"
            href="#top"
            aria-label="SmartRent PK home"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 26 26"
              aria-hidden="true"
            >
              <rect
                x="1"
                y="1"
                width="11"
                height="11"
                rx="2"
                fill="currentColor"
              />
              <rect
                x="14"
                y="1"
                width="11"
                height="11"
                rx="2"
                fill="currentColor"
              />
              <rect
                x="1"
                y="14"
                width="11"
                height="11"
                rx="2"
                fill="currentColor"
              />
              <rect
                x="14"
                y="14"
                width="11"
                height="11"
                rx="2"
                fill="var(--signal)"
              />
            </svg>

            <span className="brand-t">
              SmartRent PK
            </span>
          </a>

          <nav className="links" aria-label="Main">
            <a href="#how">How it works</a>
            <a href="#safety">Safety</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">Questions</a>
          </nav>

          <a className="btn small" href="#/rent">
            Rent a locker
          </a>

          <button
            className="menubtn"
            type="button"
            aria-label={
              menuOpen ? "Close menu" : "Open menu"
            }
            aria-expanded={menuOpen}
            aria-controls="mnav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              aria-hidden="true"
            >
              <path
                d="M3 6h16M3 11h16M3 16h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>
        </div>

        <nav
          className="mnav"
          id="mnav"
          aria-label="Mobile"
          hidden={!menuOpen}
        >
          <a
            href="#how"
            onClick={() => setMenuOpen(false)}
          >
            How it works
          </a>

          <a
            href="#safety"
            onClick={() => setMenuOpen(false)}
          >
            Safety
          </a>

          <a
            href="#pricing"
            onClick={() => setMenuOpen(false)}
          >
            Pricing
          </a>

          <a
            href="#faq"
            onClick={() => setMenuOpen(false)}
          >
            Questions
          </a>

          <a
            className="btn"
            href="#/rent"
            onClick={() => setMenuOpen(false)}
          >
            Rent a locker
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <HeroBackground />

          <div className="wrap">
            <div>
              <h1>
                A locker you rent
                <br />
                by the hour.
              </h1>

              <p className="lede">
                Secure, same-size lockers for bags,
                parcels, and personal items. Pay by QR,
                verify with a one-time code, and open with
                your phone.
              </p>

              <div className="hero-actions">
                <a className="btn" href="#/rent">
                  Rent a locker
                </a>

                <a className="textlink" href="#how">
                  See how it works →
                </a>
              </div>

              <div className="hero-meta">
                <span>
                  <i className="dot" />
                  Machine 01 online
                </span>

                <span>Rs.100/hour</span>

                <span>4 lockers</span>
              </div>
            </div>

            <div className="hero-machine">
              <LockerMachine
                lockers={lockers}
                selected={selected}
                screen={screen}
                onLockerClick={onLockerClick}
                statusText={statusText}
              />
            </div>
          </div>
        </section>

        <section className="section" id="how">
          <div className="wrap">
            <div className="eyebrow">
              HOW IT WORKS
            </div>

            <h2>
              From free locker
              <br />
              to stored item in minutes.
            </h2>

            <div className="steps">
              <div>
                <b>01</b>
                <h3>Pick a locker</h3>
                <p>
                  Choose any available locker at the
                  machine.
                </p>
              </div>

              <div>
                <b>02</b>
                <h3>Choose your time</h3>
                <p>
                  Rent by the hour. The price is shown
                  before payment.
                </p>
              </div>

              <div>
                <b>03</b>
                <h3>Pay & verify</h3>
                <p>
                  Pay using QR and verify your phone with
                  a one-time code.
                </p>
              </div>

              <div>
                <b>04</b>
                <h3>Open & store</h3>
                <p>
                  The locker opens only after successful
                  verification.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section panel-section" id="safety">
          <div className="wrap two-col">
            <div>
              <div className="eyebrow">
                SAFETY FIRST
              </div>

              <h2>
                The system checks
                <br />
                the door, not just the button.
              </h2>

              <p className="lede">
                Every locker has a door-state sensor. SmartRent
                only confirms an opening after the physical
                door state changes.
              </p>
            </div>

            <div className="safety-card">
              <div className="safety-icon">
                <Icon id="ck" size={24} />
              </div>

              <h3>Sensor confirmed</h3>

              <p>
                The app waits for the locker sensor before
                starting your rental timer.
              </p>
            </div>
          </div>
        </section>

        <section className="section" id="pricing">
          <div className="wrap pricing-grid">
            <div>
              <div className="eyebrow">
                SIMPLE PRICING
              </div>

              <h2>
                Pay only for
                <br />
                the time you need.
              </h2>

              <p className="lede">
                The prototype uses a configurable
                Rs.100/hour example rate.
              </p>
            </div>

            <div className="calc">
              <div className="calc-head">
                <span>Rental time</span>
                <strong>{hrs(calcHours)}</strong>
              </div>

              <input
                type="range"
                min="1"
                max="24"
                value={calcHours}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setCalcHours(value);
                  onSelectHours(value);
                }}
                aria-label="Rental hours"
              />

              <div className="range-labels">
                <span>1 hour</span>
                <span>24 hours</span>
              </div>

              <div className="totalrow">
                <span>Total</span>
                <b>{money(total)}</b>
              </div>

              <p className="sub">
                Until {endLabel(calcHours)}
              </p>

              <button
                className="btn full"
                type="button"
                onClick={() => onRentFromHours(calcHours)}
              >
                Continue
              </button>
            </div>
          </div>
        </section>

        <section className="section uses-section">
          <div className="wrap">
            <div className="eyebrow">
              USE IT YOUR WAY
            </div>

            <h2>
              For people,
              <br />
              parcels, and everyday life.
            </h2>

            <div className="uses">
              <div>
                <span>01</span>
                <h3>Personal storage</h3>
                <p>
                  Store a backpack, shopping bags, or
                  other personal belongings.
                </p>
              </div>

              <div>
                <span>02</span>
                <h3>Parcel holding</h3>
                <p>
                  Use the locker as a temporary handoff
                  point for parcels.
                </p>
              </div>

              <div>
                <span>03</span>
                <h3>Short stays</h3>
                <p>
                  Keep items secure while you move around
                  the city.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="faq">
          <div className="wrap faq-wrap">
            <div>
              <div className="eyebrow">
                QUESTIONS
              </div>

              <h2>
                Good to know
              </h2>
            </div>

            <div className="faq">
              <details>
                <summary>
                  What happens if I forget to collect my
                  item?
                </summary>

                <p>
                  The rental becomes overdue and an
                  applicable fine can be applied according
                  to the rental policy.
                </p>
              </details>

              <details>
                <summary>
                  What if payment succeeds but the locker
                  does not open?
                </summary>

                <p>
                  The system records an incident instead of
                  pretending the locker opened. An operator
                  can then handle the issue.
                </p>
              </details>

              <details>
                <summary>
                  Can I use the locker for parcels?
                </summary>

                <p>
                  Yes. The SmartRent PK model supports both
                  personal storage and parcel-handling
                  workflows.
                </p>
              </details>

              <details>
                <summary>
                  Is the payment real?
                </summary>

                <p>
                  This prototype uses test/sandbox payment.
                  Nothing is actually charged.
                </p>
              </details>
            </div>
          </div>
        </section>

        <section className="find">
          <div className="wrap">
            <div>
              <div className="eyebrow">
                READY?
              </div>

              <h2>
                Try the SmartRent
                <br />
                experience.
              </h2>

              <p className="lede">
                Choose a locker and walk through the complete
                rental flow in test mode.
              </p>

              <a className="btn" href="#/rent">
                Rent a locker
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-grid">
          <Logo />

          <div>
            <span>SmartRent PK</span>
            <p>
              Smart locker rental and parcel handling.
            </p>
          </div>

          <div>
            <a href="#how">How it works</a>
            <a href="#safety">Safety</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">Questions</a>
          </div>

          <div>
            <span>Prototype</span>
            <p>Test mode · Nothing is charged</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function RentFlow({
  state,
  setState,
  lockers,
  setLockers,
  setStatusText,
  clearTimers,
  later,
}) {
  const {
    screen,
    locker,
    hours,
    paid,
    phone,
    codeSent,
    attempts,
    phase,
    endAt,
    steps,
    note,
  } = state;

  const [phoneInput, setPhoneInput] = useState(phone);
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(0);

  const update = (patch) => {
    setState((s) => ({ ...s, ...patch }));
  };

  useEffect(() => {
    setPhoneInput(phone);
  }, [phone]);

  useEffect(() => {
    if (screen !== "active" || !endAt) {
      setRemaining(0);
      return undefined;
    }

    const tick = () => {
      const left = Math.max(
        0,
        Math.floor((endAt - Date.now()) / 1000),
      );

      setRemaining(left);

      if (left <= 0) {
        setState((s) => ({
          ...s,
          note: "Time’s up. Please collect your item.",
        }));
      }
    };

    tick();

    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
  }, [screen, endAt, setState]);

  useEffect(() => {
    if (screen !== "opening") return undefined;

    const sequence = [
      { after: 700, steps: 1 },
      { after: 1400, steps: 2 },
      { after: 2100, steps: 3 },
      { after: 3100, steps: 4 },
    ];

    const ids = sequence.map((item) =>
      setTimeout(() => {
        setState((s) => ({
          ...s,
          steps: item.steps,
        }));
      }, item.after),
    );

    const final = setTimeout(() => {
      const start = Date.now();
      setState((s) => ({
        ...s,
        screen: "active",
        phase: "placing",
        endAt: start + s.hours * 3600000,
      }));

      setLockers((l) => ({
        ...l,
        [locker]: "open",
      }));

      setStatusText(
        `Locker ${locker} is open. Door sensor confirmed.`,
      );
    }, 3600);

    return () => {
      ids.forEach(clearTimeout);
      clearTimeout(final);
    };
  }, [
    screen,
    locker,
    setLockers,
    setState,
    setStatusText,
  ]);

  const sendCode = () => {
    if (!phoneInput.trim()) {
      setError("Enter your mobile number.");
      return;
    }

    setError("");

    update({
      phone: phoneInput.trim(),
      codeSent: true,
    });
  };

  const verify = () => {
    if (codeInput !== TEST_CODE) {
      const nextAttempts = attempts + 1;

      update({ attempts: nextAttempts });

      setError(
        nextAttempts >= 3
          ? "Too many attempts. Start over and try again."
          : "Incorrect code. In test mode use 482917.",
      );

      return;
    }

    setError("");

    update({
      screen: "opening",
      steps: 0,
    });
  };

  const reset = () => {
    clearTimers();

    setState({
      screen: "pick",
      locker: null,
      hours: 1,
      paid: false,
      phone: "",
      codeSent: false,
      attempts: 0,
      phase: "",
      endAt: 0,
      steps: 0,
      note: "",
      notice: "",
    });

    setLockers(initialLockers);
    setStatusText(DEFAULT_STATUS);
  };

  if (screen === "pick") {
    return (
      <>
        <div>
          <h3>Choose a locker</h3>
          <p className="sub">
            Locker 3 is currently in use.
          </p>
        </div>

        <div className="pick-grid">
          {[1, 2, 3, 4].map((n) => {
            const used = lockers[n] === "used";

            return (
              <button
                key={n}
                type="button"
                disabled={used}
                className={`pick ${
                  locker === n ? "selected" : ""
                } ${used ? "disabled" : ""}`}
                onClick={() => {
                  if (used) return;

                  update({
                    locker: n,
                    screen: "time",
                  });
                }}
              >
                <span>{n}</span>
                <small>
                  {used ? "In use" : "Available"}
                </small>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  if (screen === "time") {
    const total = hours * PRICE;

    return (
      <>
        <div>
          <h3>
            Locker {locker}
          </h3>

          <p className="sub">
            Choose how long you want to rent it.
          </p>
        </div>

        <div className="field">
          <label htmlFor="rent-hours">
            Rental hours
          </label>

          <input
            id="rent-hours"
            type="range"
            min="1"
            max="24"
            value={hours}
            onChange={(e) =>
              update({
                hours: Number(e.target.value),
              })
            }
          />

          <div className="range-labels">
            <span>1 hour</span>
            <strong>{hrs(hours)}</strong>
            <span>24 hours</span>
          </div>
        </div>

        <div className="totalrow">
          <span>Total</span>
          <b>{money(total)}</b>
        </div>

        <button
          className="btn full"
          type="button"
          onClick={() => update({ screen: "payment" })}
        >
          Continue to payment
        </button>

        <button
          className="linkbtn"
          type="button"
          onClick={() =>
            update({
              screen: "pick",
              locker: null,
            })
          }
        >
          Change locker
        </button>
      </>
    );
  }

  if (screen === "payment") {
    const total = hours * PRICE;

    return (
      <>
        <div>
          <h3>Payment</h3>

          <p className="sub">
            Scan the QR or use the test button below.
          </p>
        </div>

        <div className="qrbox">
          <div className="qr">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          <strong>{money(total)}</strong>
          <small>Sandbox payment</small>
        </div>

        <div className="paystatus">
          {paid ? (
            <span className="pill ok">
              Payment verified
            </span>
          ) : (
            <span className="pill">
              Waiting for payment…
            </span>
          )}
        </div>

        {!paid && (
          <>
            <button
              className="btn ghost full"
              type="button"
              onClick={() => {
                update({ paid: true });

                later(
                  () => update({ screen: "verify" }),
                  900,
                );
              }}
            >
              Simulate payment (test mode)
            </button>

            <button
              className="linkbtn"
              type="button"
              onClick={() =>
                update({ screen: "time" })
              }
            >
              Change time
            </button>
          </>
        )}
      </>
    );
  }

  if (screen === "verify") {
    if (!codeSent) {
      return (
        <>
          <div>
            <h3>Verify your phone</h3>

            <p className="sub">
              We text a one-time code. It expires quickly
              and works once.
            </p>
          </div>

          <div className="field">
            <label htmlFor="ph">
              Mobile number
            </label>

            <input
              id="ph"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0300 1234567"
              value={phoneInput}
              onChange={(e) => {
                setPhoneInput(e.target.value);
                setError("");
              }}
              onKeyDown={(e) =>
                e.key === "Enter" && sendCode()
              }
            />
          </div>

          <p className="err" role="alert">
            {error}
          </p>

          <button
            className="btn full"
            type="button"
            onClick={sendCode}
          >
            Send code
          </button>
        </>
      );
    }

    return (
      <>
        <div>
          <h3>Enter your code</h3>

          <p className="sub">
            Sent to {phone}. Test mode: use {TEST_CODE}.
          </p>
        </div>

        <div className="field">
          <label htmlFor="cd">
            6-digit code
          </label>

          <input
            id="cd"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            placeholder="6 digits"
            value={codeInput}
            onChange={(e) => {
              setCodeInput(e.target.value);
              setError("");
            }}
            onKeyDown={(e) =>
              e.key === "Enter" && verify()
            }
          />
        </div>

        <p className="err" role="alert">
          {error}
        </p>

        <button
          className="btn full"
          type="button"
          onClick={verify}
        >
          Verify and open
        </button>

        <button
          className="linkbtn"
          type="button"
          onClick={() =>
            update({
              codeSent: false,
            })
          }
        >
          Use a different number
        </button>
      </>
    );
  }

  if (screen === "opening") {
    const labels = [
      [
        "Payment verified",
        "Payment verified",
      ],
      [
        "Code verified",
        "Code verified",
      ],
      [
        "Sending unlock command…",
        "Unlock command sent",
      ],
      [
        "Waiting for the door sensor…",
        "Door sensor reports open",
      ],
    ];

    return (
      <>
        <div>
          <h3>
            Opening locker {locker}
          </h3>

          <p className="sub">
            We only say it’s open once the door sensor
            confirms.
          </p>
        </div>

        <ol className="steplist">
          {labels.map((l, i) => {
            const d = i < steps;

            return (
              <li
                className={d ? "done" : "wait"}
                key={i}
              >
                <Icon id={d ? "ck" : "pd"} />
                <span>{d ? l[1] : l[0]}</span>
              </li>
            );
          })}
        </ol>
      </>
    );
  }

  if (screen === "active") {
    const open =
      phase === "placing" ||
      phase === "collecting";

    if (phase === "done") {
      return (
        <>
          <div>
            <h3>Rental ended</h3>

            <p className="sub">
              Locker {locker} is free again.
            </p>
          </div>

          <div className="totalrow">
            <span className="sub">
              Paid
            </span>

            <b>
              {money(hours * PRICE)}
            </b>
          </div>

          <p className="sub">
            {hrs(hours)} in test mode. Nothing was
            charged.
          </p>

          <button
            className="btn full"
            type="button"
            onClick={reset}
          >
            Rent another locker
          </button>
        </>
      );
    }

    return (
      <>
        <div className="tile">
          <div className="n">
            {locker}
          </div>

          <div>
            <h3 style={{ fontSize: 20 }}>
              Locker {locker}
              {open
                ? " is open"
                : " is locked"}
            </h3>

            <p
              className="sub"
              style={{
                color: "var(--ok)",
              }}
            >
              {open
                ? "Confirmed by door sensor"
                : "Door sensor reports closed"}
            </p>
          </div>
        </div>

        <div className="timerbox">
          <div className="timer">
            {fmt(remaining)}
          </div>

          <p className="sub">
            {remaining === 0
              ? "Time’s up. Collect your item to avoid an overdue fee."
              : "left on your rental"}
          </p>
        </div>

        {phase === "placing" ? (
          <>
            <p className="sub">
              Place your item inside and close the door.
              The app updates when the sensor sees it
              close.
            </p>

            <button
              className="btn full"
              type="button"
              onClick={() => {
                setLockers((l) => ({
                  ...l,
                  [locker]: "used",
                }));

                setStatusText(
                  `Locker ${locker} is locked and in use.`,
                );

                update({
                  phase: "running",
                });
              }}
            >
              I’ve closed the door
            </button>
          </>
        ) : phase === "collecting" ? (
          <>
            <p className="sub">
              Take your item, then close the door.
            </p>

            <button
              className="btn full"
              type="button"
              onClick={() => {
                const done = locker;
                const paid = hours * PRICE;

                clearTimers();

                setLockers((l) => ({
                  ...l,
                  [done]: "free",
                }));

                setStatusText(
                  `Locker ${done} is free again.`,
                );

                setState({
                  screen: "pick",
                  locker: null,
                  hours: 1,
                  paid: false,
                  phone: "",
                  codeSent: false,
                  attempts: 0,
                  phase: "",
                  endAt: 0,
                  steps: 0,
                  note: "",
                  notice: `Rental ended. Locker ${done} is free again. Paid ${money(
                    paid,
                  )} (test mode).`,
                });
              }}
            >
              I’ve taken my item
            </button>
          </>
        ) : (
          <>
            {note && (
              <p
                className="sub"
                role="status"
              >
                {note}
              </p>
            )}

            <div className="btnrow">
              <button
                className="btn ghost"
                type="button"
                onClick={() =>
                  update({
                    endAt:
                      endAt + 3600000,
                    hours: hours + 1,
                    note: `1 hour added for ${money(
                      PRICE,
                    )} (test mode).`,
                  })
                }
              >
                Add 1 hour
              </button>

              <button
                className="btn"
                type="button"
                onClick={() => {
                  setLockers((l) => ({
                    ...l,
                    [locker]: "open",
                  }));

                  setStatusText(
                    `Locker ${locker} is open for collection.`,
                  );

                  update({
                    phase: "collecting",
                    note: "",
                  });
                }}
              >
                Collect item
              </button>
            </div>
          </>
        )}
      </>
    );
  }

  return null;
}

export default function Page() {
  const [lockers, setLockers] =
    useState(initialLockers);

  const [statusText, setStatusText] =
    useState(DEFAULT_STATUS);

  const [state, setState] = useState({
    screen: "pick",
    locker: null,
    hours: 1,
    paid: false,
    phone: "",
    codeSent: false,
    attempts: 0,
    phase: "",
    endAt: 0,
    steps: 0,
    note: "",
    notice: "",
  });

  const [hash, setHash] = useState("");

  const timers = useRef([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const later = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  const isRent = hash === "#/rent";

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches
    ) {
      return undefined;
    }

    document.documentElement.classList.add("js");

    const rv = document.querySelectorAll(
      ".steps li,.facts li,.log,.calc,.uses div,details,.section h2,.find .wrap>*",
    );

    rv.forEach((el, i) => {
      el.classList.add("rv");
      el.style.setProperty(
        "--d",
        `${(i % 4) * 0.1}s`,
      );
    });

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }),
      {
        threshold: 0.15,
      },
    );

    rv.forEach((el) => io.observe(el));

    const nav =
      document.querySelector(".nav");

    const onScroll = () => {
      nav?.classList.toggle(
        "scrolled",
        window.scrollY > 12,
      );
    };

    window.addEventListener(
      "scroll",
      onScroll,
      { passive: true },
    );

    onScroll();

    return () => {
      io.disconnect();

      window.removeEventListener(
        "scroll",
        onScroll,
      );
    };
  }, [isRent]);

  useEffect(() => {
    const onHash = () => {
      setHash(window.location.hash);

      document.title =
        window.location.hash === "#/rent"
          ? "Rent a locker | SmartRent PK"
          : "SmartRent PK | Rent a locker by the hour";

      if (
        window.location.hash === "#/rent" &&
        window.innerWidth <= 900
      ) {
        setTimeout(
          () =>
            document
              .getElementById("phone")
              ?.scrollIntoView(),
          0,
        );
      } else if (
        window.location.hash !== "#/rent"
      ) {
        const id =
          window.location.hash.slice(1);

        const el =
          id && !id.startsWith("/")
            ? document.getElementById(id)
            : null;

        if (el) {
          setTimeout(
            () =>
              el.scrollIntoView(),
            0,
          );
        }
      }
    };

    onHash();

    window.addEventListener(
      "hashchange",
      onHash,
    );

    return () =>
      window.removeEventListener(
        "hashchange",
        onHash,
      );
  }, []);

  const goRent = (hours) => {
    setState((s) => ({
      ...s,
      hours,
      screen: s.locker
        ? "time"
        : "pick",
      paid: false,
    }));

    window.location.hash = "#/rent";
  };

  const onLockerClick = (n) => {
    if (lockers[n] === "used") {
      setStatusText(
        `Locker ${n} is in use.`,
      );

      return;
    }

    if (
      (state.screen === "opening" ||
        state.screen === "active") &&
      n === state.locker
    ) {
      return;
    }

    const open =
      lockers[n] !== "open";

    setLockers((l) => ({
      ...l,
      [n]: open ? "open" : "free",
    }));

    if (
      state.screen === "pick" ||
      state.screen === "time"
    ) {
      setState((s) => ({
        ...s,
        locker: n,
      }));
    }

    setStatusText(
      open
        ? `Locker ${n} open. Door sensor confirmed. Real lockers only open after payment and a one-time code.`
        : `Locker ${n} closed. The sensor confirms the door is shut.`,
    );
  };

  return (
    <>
      <SvgDefs />

      {isRent ? (
        <RentPage
          state={state}
          setState={setState}
          lockers={lockers}
          setLockers={setLockers}
          setStatusText={setStatusText}
          clearTimers={clearTimers}
          later={later}
        />
      ) : (
        <Home
          lockers={lockers}
          selected={state.locker}
          screen={state.screen}
          statusText={statusText}
          onLockerClick={onLockerClick}
          onSelectHours={(h) =>
            setState((s) => ({
              ...s,
              hours: h,
            }))
          }
          hours={state.hours}
          onRentFromHours={goRent}
        />
      )}
    </>
  );
}

function RentPage({
  state,
  setState,
  lockers,
  setLockers,
  setStatusText,
  clearTimers,
  later,
}) {
  return (
    <div id="view-rent">
      <header className="rentbar">
        <div className="wrap">
          <a
            className="backbtn"
            href="#/"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                d="M12.5 4.5L7 10l5.5 5.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            Back to home page
          </a>

          <Logo className="rentbrand" />
        </div>
      </header>

      <main>
        <div className="wrap rentgrid">
          <div
            className="phone"
            id="phone"
            role="group"
            aria-label="SmartRent PK app demo"
          >
            <div className="phone-top">
              <span>SmartRent PK</span>

              <span>
                <i className="dot" />
                Machine 01 online
              </span>
            </div>

            <div
              className="screen"
              aria-live="polite"
            >
              <RentFlow
                state={state}
                setState={setState}
                lockers={lockers}
                setLockers={setLockers}
                setStatusText={setStatusText}
                clearTimers={clearTimers}
                later={later}
              />
            </div>
          </div>

          <div className="rintro">
            <h1 className="rtitle">
              Rent a locker
            </h1>

            <p
              className="lede"
              style={{ marginTop: 14 }}
            >
              Pick a locker, pay, verify, and open.
              Payment and codes run in test mode, so
              nothing is charged.
            </p>
          </div>

          <div className="rnotes">
            <ul className="facts">
              <li>
                <strong>
                  Test details
                </strong>

                <span>
                  Any mobile number works. The test
                  code is 482917.
                </span>
              </li>

              <li>
                <strong>
                  Already taken
                </strong>

                <span>
                  Locker 3 is in use, so it can't be
                  chosen.
                </span>
              </li>

              <li>
                <strong>
                  Your time
                </strong>

                <span>
                  The countdown starts when the door
                  sensor confirms the door is open.
                </span>
              </li>
            </ul>

            <p style={{ marginTop: 20 }}>
              <button
                className="btn ghost small"
                type="button"
                onClick={() => {
                  clearTimers();

                  setState({
                    screen: "pick",
                    locker: null,
                    hours: 1,
                    paid: false,
                    phone: "",
                    codeSent: false,
                    attempts: 0,
                    phase: "",
                    endAt: 0,
                    steps: 0,
                    note: "",
                    notice: "",
                  });

                  setLockers(initialLockers);

                  setStatusText(
                    DEFAULT_STATUS,
                  );
                }}
              >
                Start over
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
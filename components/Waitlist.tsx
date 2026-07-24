"use client";
import { useState } from "react";
import { isValidEmail } from "@/lib/validate";
import Reveal from "./Reveal";

type Status = "idle" | "sending" | "done" | "error";

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setStatus("error");
      setMessage("That email does not look right.");
      return;
    }
    setStatus("sending");
    const company = (new FormData(e.currentTarget).get("company") as string) ?? "";
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, zip, company }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("done");
      } else {
        setStatus("error");
        setMessage(data.error === "rate_limited" ? "Too many tries. Wait a minute." : "That did not go through. Check the fields.");
      }
    } catch {
      setStatus("error");
      setMessage("Network hiccup. Try again.");
    }
  }

  return (
    <section
      id="waitlist"
      className="px-5 py-32 md:px-10 md:py-44"
      style={{ background: "var(--gradient-waitlist-band)" }}
    >
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <p className="text-xs font-medium text-signal">Early access</p>
        </Reveal>
        <Reveal index={1}>
          <h2 className="font-display mt-6 text-[clamp(2.4rem,5vw,4.2rem)] font-bold leading-tight tracking-[-0.01em]">
            Drive DFW with eyes everywhere
          </h2>
        </Reveal>
        {status === "done" ? (
          <div className="mt-10 rounded-lg border border-border bg-ground p-6 shadow-card">
            <span className="text-signal">You are on the list.</span>
            <p className="mt-2 text-sm text-ink-2">We will email you when Coasta goes live in DFW.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-10">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" aria-label="Email address"
                className="flex-1 border border-input-border bg-ground px-5 py-4 text-sm text-ink outline-none transition-colors duration-300 [transition-timing-function:var(--ease-signal)] placeholder:text-placeholder focus:border-signal"
              />
              <input
                type="text" inputMode="numeric" value={zip} onChange={(e) => setZip(e.target.value)}
                placeholder="ZIP (optional)" aria-label="ZIP code, optional" maxLength={5}
                className="border border-input-border bg-ground px-5 py-4 text-sm text-ink outline-none transition-colors duration-300 [transition-timing-function:var(--ease-signal)] placeholder:text-placeholder focus:border-signal sm:w-40"
              />
              <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              <button
                type="submit" disabled={status === "sending"}
                className="bg-signal px-8 py-4 text-sm font-medium text-ground transition-transform duration-300 [transition-timing-function:var(--ease-signal)] hover:-translate-y-0.5 disabled:bg-[#DCE8FB] disabled:text-ink-2"
              >
                {status === "sending" ? "Joining..." : "Join waitlist"}
              </button>
            </div>
            {status === "error" && <p className="mt-3 text-sm text-error" role="alert">{message}</p>}
          </form>
        )}
      </div>
    </section>
  );
}

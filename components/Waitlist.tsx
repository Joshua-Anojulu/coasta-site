"use client";
import { useState } from "react";
import { isValidEmail } from "@/lib/validate";

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
    <section id="waitlist" className="px-5 py-32 md:px-10 md:py-44">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs uppercase text-signal">Early access</p>
        <h2 className="font-display mt-6 text-4xl uppercase leading-tight md:text-7xl">
          Drive DFW with eyes everywhere
        </h2>
        {status === "done" ? (
          <div className="mt-10 border border-signal/40 bg-signal/5 p-6">
            <span className="text-signal">You are on the list.</span>
            <p className="mt-2 text-sm text-fog-dim">We will email you when Coasta goes live in DFW.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-10">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" aria-label="Email address"
                className="flex-1 border border-white/15 bg-surface px-5 py-4 text-sm outline-none transition-colors duration-300 [transition-timing-function:var(--ease-signal)] placeholder:text-fog-dim/50 focus:border-signal"
              />
              <input
                type="text" inputMode="numeric" value={zip} onChange={(e) => setZip(e.target.value)}
                placeholder="ZIP (optional)" aria-label="ZIP code, optional" maxLength={5}
                className="border border-white/15 bg-surface px-5 py-4 text-sm outline-none transition-colors duration-300 [transition-timing-function:var(--ease-signal)] placeholder:text-fog-dim/50 focus:border-signal sm:w-40"
              />
              <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              <button
                type="submit" disabled={status === "sending"}
                className="bg-signal px-8 py-4 text-sm font-medium uppercase text-asphalt transition-transform duration-300 [transition-timing-function:var(--ease-signal)] hover:-translate-y-0.5 disabled:opacity-60"
              >
                {status === "sending" ? "Joining..." : "Join waitlist"}
              </button>
            </div>
            {status === "error" && <p className="mt-3 text-sm text-alert">{message}</p>}
          </form>
        )}
      </div>
    </section>
  );
}

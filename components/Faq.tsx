export const PRIVACY_ANSWER_AWAITING_SIGN_OFF =
  "Privacy and data-retention details will be published after Coasta's retention policy is signed."

const ITEMS = [
  {
    answer:
      "Coasta launches in DFW first. Join the waitlist and we will email you the moment your area goes live.",
    question: "When does Coasta launch?",
  },
  {
    answer:
      "Early access is free for waitlist members. Pricing for later plans will be announced before launch.",
    question: "How much does it cost?",
  },
  {
    answer:
      "From public traffic cameras read by our detection models. Every alert is camera-verified before it reaches you.",
    question: "Where do the alerts come from?",
  },
  {
    answer: PRIVACY_ANSWER_AWAITING_SIGN_OFF,
    question: "Is my privacy protected?",
  },
  {
    answer:
      "The DFW metroplex is first. Expansion cities will be chosen with input from the waitlist.",
    question: "Which cities are next?",
  },
] as const

export function Faq() {
  return (
    <div className="faq-list" id="questions">
      {ITEMS.map((item) => (
        <details key={item.question}>
          <summary>
            <span>{item.question}</span>
            <span aria-hidden="true" className="faq-toggle">
              +
            </span>
          </summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  )
}

// No privacy or data-retention question is published here. The FAQ previously
// claimed Coasta stores no faces, plates or location history, which is in
// tension with the retention the product strategy describes, and no signed
// retention policy exists to settle the wording. Silence is the honest state:
// the item returns once there is a policy to quote.
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

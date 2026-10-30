import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const questions = [
  { question: "What can a parent see?", answer: "The connection screen lists study and focus time, sessions and subjects, progress and streaks, and weekly goals. It says this information is shared automatically while connected." },
  { question: "Does my child approve the connection?", answer: "Yes. Your child reviews the listed sharing information and approves the connection in the student app." },
  { question: "Can my child study with paper?", answer: "Paper mode is part of the FocusLens design. Its available insights differ from digital mode." },
  { question: "What is included in Free?", answer: "One connected child, 10 study sessions and 30 AI credits each month, plus core progress features." },
  { question: "How do sessions and AI credits differ?", answer: "Sessions are a study allowance. AI credits are used for supported AI actions. These are separate monthly allowances." },
  { question: "Can I connect more than one child?", answer: "The Family plan supports up to three children with separate allowances and child views." },
  { question: "Which devices are supported?", answer: "Device compatibility and download links will be confirmed for launch. See the compatibility preview." },
  { question: "How do billing and account deletion work?", answer: "Approved billing and account-deletion guidance is being finalized. The Help and legal previews identify the remaining information." },
];

export default function LandingFaqSection() {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <section className="landing-faq" id="faqs" aria-labelledby="landing-faq-title">
      <div className="landing-faq-inner">
        <h2 id="landing-faq-title">FocusLens answers, <span>in one place.</span></h2>
        <div className="landing-faq-list">
          {questions.map(({ question, answer }, index) => {
            const isOpen = openIndex === index;
            const answerId = `landing-faq-answer-${index}`;
            return (
              <article className={`landing-faq-item${isOpen ? " is-open" : ""}`} key={question}>
                <button className="landing-faq-question" type="button" aria-expanded={isOpen} aria-controls={answerId} onPointerDown={(event) => event.stopPropagation()} onClick={() => setOpenIndex(isOpen ? -1 : index)}>
                  <span>{question}</span><span className="landing-faq-icon" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                </button>
                <div className="landing-faq-answer" id={answerId} aria-hidden={!isOpen}><p>{answer}</p></div>
              </article>
            );
          })}
        </div>
        <Link className="landing-faq-all" to="/faqs">See all FAQs <ArrowRight size={14} aria-hidden="true" /></Link>
      </div>
    </section>
  );
}



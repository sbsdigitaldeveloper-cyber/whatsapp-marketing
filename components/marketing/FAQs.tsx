"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQs() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does the free trial work?",
      answer:
        "You can use all core features for 14 days without entering your credit card. Upgrade anytime to continue using the platform.",
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer:
        "Yes. There are no long-term contracts. You can cancel or downgrade your plan at any time from your dashboard.",
    },
    {
      question: "Do you offer support?",
      answer:
        "Absolutely. We provide email support on all plans and priority support for Pro and Enterprise customers.",
    },
    {
      question: "Is my data secure?",
      answer:
        "We use industry-standard encryption and secure cloud infrastructure to ensure your data is always protected.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="py-28 px-6 lg:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">
            FAQs
          </span>
          <h3 className="text-4xl lg:text-5xl font-bold mt-3 mb-6">
            Frequently Asked Questions
          </h3>
          <p className="text-xl text-gray-600">
            Everything you need to know before getting started.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm transition-all duration-300"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between text-left p-6"
              >
                <span className="text-lg font-semibold">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-300 ${
                    activeIndex === index ? "rotate-180 text-green-600" : ""
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  activeIndex === index
                    ? "max-h-40 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// components/landing/Pricing.tsx
import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      title: "Starter",
      price: "$29",
      period: "/mo",
      description: "Perfect for small businesses",
      features: [
        "5,000 messages/month",
        "Campaign builder with templates",
        "Real-time delivery status",
      ],
      popular: true,
      link: "/register",
      color: "from-green-500 to-emerald-600",
    },
    {
      title: "Pro",
      price: "$79",
      period: "/mo",
      description: "",
      features: [
        "25,000 messages/month",
        "Advanced analytics",
        "Priority support",
      ],
      popular: false,
      link: "/register",
      color: "border-green-500 text-green-600",
    },
    {
      title: "Enterprise",
      price: "Custom",
      period: "",
      description: "",
      features: [
        "Unlimited messages",
        "Dedicated account manager",
        "Custom integrations",
      ],
      popular: false,
      link: "/contact",
      color: "border-gray-300",
    },
  ];

  return (
    <section id="pricing" className="py-28 px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">
            Pricing
          </span>
          <h3 className="text-4xl lg:text-5xl font-bold mt-3 mb-6">
            Simple, transparent pricing
          </h3>
          <p className="text-xl text-gray-600">
            Start for free, upgrade when you scale. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-3xl shadow-2xl border ${
                plan.popular ? "border-gray-200" : plan.color
              } p-8 lg:p-10 relative overflow-hidden`}
            >
              {plan.popular && (
                <div className="absolute top-5 right-5 bg-green-100 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full">
                  MOST POPULAR
                </div>
              )}

              <div className="flex items-center gap-3 mb-6">
                {plan.popular && (
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center text-white text-xl font-bold`}
                  >
                    S
                  </div>
                )}
                <div>
                  <h4 className="text-2xl font-bold">{plan.title}</h4>
                  {plan.description && (
                    <p className="text-gray-500">{plan.description}</p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <span className="text-5xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className="text-gray-500 text-xl">{plan.period}</span>
                )}
              </div>

              <ul className="space-y-4 mb-8 text-gray-600">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.link}
                className={`w-full ${
                  plan.popular
                    ? `bg-gradient-to-r ${plan.color} text-white`
                    : `border ${plan.color} text-green-600 hover:bg-green-50`
                } px-6 py-4 rounded-xl font-semibold hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2`}
              >
                {plan.popular ? "Get Started" : plan.title === "Enterprise" ? "Contact Sales" : "Choose Plan"}{" "}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// components/landing/FeatureSection.tsx

import { MessageSquare, BarChart3, Zap } from "lucide-react";
import FeatureCard from "../common/FeatureCards";

export default function FeatureSection() {
  const features = [
    {
      title: "Bulk Messaging",
      desc: "Send thousands of personalized WhatsApp messages instantly with high deliverability.",
      icon: <MessageSquare className="w-8 h-8 text-white" />,
      color: "bg-gradient-to-br from-green-500 to-emerald-600",
    },
    {
      title: "Real-Time Analytics",
      desc: "Track sent, delivered, and read messages with live dashboards and detailed reports.",
      icon: <BarChart3 className="w-8 h-8 text-white" />,
      color: "bg-gradient-to-br from-blue-500 to-cyan-600",
    },
    {
      title: "Campaign Builder",
      desc: "Drag-and-drop builder to create and schedule complex campaigns in minutes.",
      icon: <Zap className="w-8 h-8 text-white" />,
      color: "bg-gradient-to-br from-purple-500 to-pink-600",
    },
  ];

  return (
    <section id="features" className="py-28 px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">
            Powerful features
          </span>
          <h3 className="text-4xl lg:text-5xl font-bold mt-3 mb-6">
            Everything You Need to Succeed
          </h3>
          <p className="text-xl text-gray-600">
            All the tools to run high‑performing WhatsApp campaigns, without
            the complexity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <FeatureCard key={idx} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}



export default function WhyWhatsApp() {
  const stats = [
    { label: "Open Rates", value: "98%" },
    { label: "Click Rates", value: "45-60%" },
    { label: "Active Users", value: "2.60Bn+" },
    { label: "Engagement Rate", value: "70%" },
  ];

  return (
    <section className="py-28 px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto text-center">
        {/* Header */}
        <h2 className="text-4xl lg:text-5xl font-bold mb-4">
          Why WhatsApp?
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-16">
          WhatsApp is the One Platform that brings together Actionable Notifications & Customer Support!
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-green-50 rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300"
            >
              <h3 className="text-4xl font-extrabold text-green-600 mb-2">
                {stat.value}
              </h3>
              <p className="text-gray-700 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}






// components/common/FeatureCard.tsx
export default function FeatureCard({ icon, title, desc, color }: any) {
  return (
    <div className="group relative bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
      <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h4 className="text-xl font-bold mb-3 group-hover:text-green-600 transition">{title}</h4>
      <p className="text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}

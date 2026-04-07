"use client";

export default function LogoMarquee() {
  // List of logos (replace with your own or local / CDN images)
  const logos = [
    "/logos/logo1.png",
    "/logos/logo2.png",
    "/logos/logo3.png",
    "/logos/logo4.png",
    "/logos/logo5.png",
    "/logos/logo6.png",
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto overflow-hidden relative">
        <div className="flex animate-marquee whitespace-nowrap gap-16">
          {logos.concat(logos).map((logo, index) => (
            <div key={index} className="flex-shrink-0 w-32 md:w-40">
              <img
                src={logo}
                alt={`Logo ${index + 1}`}
                className="object-contain w-full h-16 grayscale opacity-70 hover:opacity-100 transition-all duration-300"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Tailwind animation */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </section>
  );
}

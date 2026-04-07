import { Star } from "lucide-react";
import Image from "next/image";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Director",
      company: "GrowthLab",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      content:
        "This platform completely transformed how we manage campaigns. The analytics are incredibly powerful and easy to understand.",
      rating: 5,
    },
    {
      name: "David Kim",
      role: "Founder",
      company: "StartupX",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      content:
        "The automation tools saved us countless hours every week. Highly recommend for growing businesses.",
      rating: 5,
    },
    {
      name: "Emily Carter",
      role: "Operations Manager",
      company: "ScaleFlow",
      image: "https://randomuser.me/api/portraits/women/68.jpg",
      content:
        "Clean interface, powerful features, and fantastic support. It’s everything we needed in one place.",
      rating: 5,
    },
  ];

  return (
    <section className="py-28 px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">
            Testimonials
          </span>
          <h3 className="text-4xl lg:text-5xl font-bold mt-3 mb-6">
            Loved by businesses worldwide
          </h3>
          <p className="text-xl text-gray-600">
            See what our customers are saying about our platform.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-2"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* User */}
              <div className="flex items-center gap-4">
                <Image
                  src={testimonial.image}
                  alt={testimonial.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500">
                    {testimonial.role} • {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// components/landing/ImageTextSection.tsx
import React from "react";

interface ImageTextSectionProps {
  title: string;
  description: string;
  imageSrc: string;
  alt?: string;
  buttonText?: string;
  buttonLink?: string;
  reverse?: boolean; // if true, image goes to left
}

export default function ImageTextSection({
  title,
  description,
  imageSrc,
  alt = "Image",
  buttonText,
  buttonLink,
  reverse = false,
}: ImageTextSectionProps) {
  return (
    <section className="py-20 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className={`${reverse ? "md:order-last" : ""} space-y-6`}>
            <h3 className="text-4xl lg:text-5xl font-bold leading-tight">
              {title}
            </h3>
            <p className="text-xl text-gray-600 leading-relaxed">
              {description}
            </p>
            {buttonText && buttonLink && (
              <a
                href={buttonLink}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                {buttonText}
              </a>
            )}
          </div>

          {/* Image */}
          <div className={`${reverse ? "md:order-first" : ""} relative rounded-3xl overflow-hidden shadow-2xl`}>
            <img
              src={imageSrc}
              alt={alt}
              className="w-full h-full object-cover rounded-3xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

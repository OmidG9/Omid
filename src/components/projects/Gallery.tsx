"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, BookOpen, X } from "lucide-react";
import { ProjectImage } from "@/data/portfolio";

interface GalleryProps {
  images: ProjectImage[];
  title: string;
}

export default function Gallery({ images, title }: GalleryProps) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (images.length === 0) return null;

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <>
      <div className="space-y-4">
        {/* Main image */}
        <div
          className="relative h-72 md:h-96 bg-linear-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden cursor-pointer group"
          onClick={() => setLightbox(true)}
        >
          <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-blue-600/10 to-cyan-500/5">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
                <BookOpen size={28} className="text-blue-400" />
              </div>
              <p className="text-slate-400 text-sm">{images[current].alt}</p>
              <p className="text-slate-600 text-xs mt-1">
                {images[current].src}
              </p>
            </div>
          </div>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 flex items-center justify-center">
            <span className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
              بزرگ‌تر
            </span>
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  i === current
                    ? "border-blue-500 shadow-glow"
                    : "border-slate-700 hover:border-slate-500"
                }`}
                aria-label={img.alt}
              >
                <div className="w-full h-full bg-linear-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <BookOpen size={14} className="text-blue-400/60" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Navigation for multiple images */}
        {images.length > 1 && (
          <div className="flex items-center justify-between">
            <button
              onClick={prev}
              className="p-2 glass-card hover:border-blue-500/40 text-slate-400 hover:text-slate-100 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="تصویر قبلی"
            >
              <ChevronRight size={18} />
            </button>
            <span className="text-slate-500 text-sm">
              {current + 1} / {images.length}
            </span>
            <button
              onClick={next}
              className="p-2 glass-card hover:border-blue-500/40 text-slate-400 hover:text-slate-100 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="تصویر بعدی"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setLightbox(false)}
          >
            <button
              className="absolute top-4 right-4 p-2 text-white bg-slate-800/80 rounded-full hover:bg-slate-700 transition-colors"
              onClick={() => setLightbox(false)}
              aria-label="بستن"
            >
              <X size={20} />
            </button>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="max-w-3xl w-full h-[70vh] bg-slate-900 rounded-2xl flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <BookOpen size={48} className="text-blue-400 mx-auto mb-4" />
                <p className="text-slate-300 text-sm">{images[current].alt}</p>
                <p className="text-slate-500 text-xs mt-1">
                  {images[current].src}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Send, Mail, MessageSquare, User } from "lucide-react";
import { ContactFormData } from "@/lib/contactSchema";

export default function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (json.success) {
        setSuccess(true);
        reset();
        toast.success("پیام شما با موفقیت ارسال شد!");
      } else {
        toast.error(json.message || "خطایی رخ داد، دوباره تلاش کنید.");
      }
    } catch {
      toast.error("اتصال به سرور برقرار نشد.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="glass-card p-8 text-center" dir="rtl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
          <Send size={28} className="text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">
          پیام ارسال شد!
        </h3>
        <p className="text-slate-400 mb-6">به زودی با شما تماس می‌گیریم.</p>
        <button onClick={() => setSuccess(false)} className="btn-secondary">
          ارسال پیام جدید
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="glass-card p-4 sm:p-6 space-y-5"
      dir="rtl"
      noValidate
    >
      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"
        >
          <User size={14} className="text-blue-400" />
          نام شما
        </label>
        <input
          id="name"
          type="text"
          placeholder="امید قنبری"
          className={`input-field ${errors.name ? "border-red-500/60 focus:ring-red-500" : ""}`}
          {...register("name", {
            required: "نام الزامی است",
            minLength: { value: 2, message: "نام باید حداقل ۲ کاراکتر باشد" },
          })}
        />
        {errors.name && (
          <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"
        >
          <Mail size={14} className="text-blue-400" />
          آدرس ایمیل
        </label>
        <input
          id="email"
          type="email"
          placeholder="example@email.com"
          dir="ltr"
          className={`input-field ${errors.email ? "border-red-500/60 focus:ring-red-500" : ""}`}
          {...register("email", {
            required: "ایمیل الزامی است",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "ایمیل معتبر نیست",
            },
          })}
        />
        {errors.email && (
          <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
        )}
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2"
        >
          <MessageSquare size={14} className="text-blue-400" />
          پیام شما
        </label>
        <textarea
          id="message"
          rows={5}
          placeholder="پیام خود را بنویسید..."
          className={`input-field resize-none ${errors.message ? "border-red-500/60 focus:ring-red-500" : ""}`}
          {...register("message", {
            required: "پیام الزامی است",
            minLength: {
              value: 10,
              message: "پیام باید حداقل ۱۰ کاراکتر باشد",
            },
          })}
        />
        {errors.message && (
          <p className="mt-1.5 text-xs text-red-400">
            {errors.message.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full btn-primary justify-center py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            در حال ارسال...
          </>
        ) : (
          <>
            <Send size={17} />
            ارسال پیام
          </>
        )}
      </button>
    </form>
  );
}

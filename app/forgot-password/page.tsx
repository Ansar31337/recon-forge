import React from "react";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a0e1a]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-cyan-400 font-mono font-bold text-2xl tracking-wider">
            recon-forge
          </h1>
          <p className="text-gray-400 text-sm mt-1">Reset your password</p>
        </div>
        <div className="bg-navy-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}

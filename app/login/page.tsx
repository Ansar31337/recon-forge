import React from "react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a0e1a]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-cyan-400 font-mono font-bold text-2xl tracking-wider">
            recon-forge
          </h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to your account</p>
        </div>
        <div className="bg-navy-800/80 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

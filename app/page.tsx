"use client";

import React, { useState } from "react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";

export default function HomePage() {
  const [showPricing, setShowPricing] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-200">
      <nav className="sticky top-0 z-50 bg-navy-900/80 backdrop-blur-md border-b border-cyan-500/15">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-mono font-bold text-xl tracking-wider">
              recon-forge
            </span>
            <span className="text-gray-500 text-xs border-l border-cyan-500/20 pl-3 ml-1">
              Multi-Source Passive Subdomain Intelligence and Attack Surface
              Discovery Platform
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPricing(!showPricing)}
              className={`px-4 py-2 text-sm border rounded-md transition-colors ${
                showPricing
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/60"
                  : "border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
              }`}
            >
              Pricing
            </button>
            <Link
              href="/login"
              className="px-4 py-2 text-sm border border-cyan-500/40 text-cyan-400 rounded-md hover:bg-cyan-500/10 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm bg-cyan-500 text-navy-900 font-semibold rounded-md hover:bg-cyan-400 shadow-cyan-glow transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Attack Surface Intelligence
            <br />
            <span className="text-cyan-400">Reconnaissance Platform</span>
          </h1>
          <p className="text-gray-400 text-lg mb-6 leading-relaxed">
            recon-forge helps Hunters and Companies organize security
            reconnaissance in a clean, role-based workspace.
          </p>
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="px-3 py-1 text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">
              Role-Based Access
            </span>
            <span className="px-3 py-1 text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">
              Cybersecurity Dashboard UI
            </span>
            <span className="px-3 py-1 text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">
              Recon Workspace
            </span>
          </div>
        </div>
        <div className="bg-navy-800/60 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 shadow-cyan-glow-lg">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-navy-700/60 rounded-lg border border-cyan-500/15">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-cyan-glow" />
              <span className="text-gray-300 text-sm">DNS Resolution</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-navy-700/60 rounded-lg border border-cyan-500/15">
              <span className="w-2 h-2 rounded-full bg-cyan-500/60" />
              <span className="text-gray-300 text-sm">Port Scanning</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-navy-700/60 rounded-lg border border-cyan-500/15">
              <span className="w-2 h-2 rounded-full bg-cyan-500/40" />
              <span className="text-gray-300 text-sm">
                Technology Detection
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-navy-700/60 rounded-lg border border-cyan-500/15">
              <span className="w-2 h-2 rounded-full bg-cyan-500/20" />
              <span className="text-gray-300 text-sm">Endpoint Crawling</span>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-2">
          Attack Surface Preview
        </h2>
        <p className="text-center text-gray-400 mb-10">
          A clean visual overview of how external assets can be organized after
          login.
        </p>
        <div className="border border-cyan-500/30 rounded-xl p-8 shadow-cyan-glow-lg bg-navy-800/40 backdrop-blur-sm">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Root Domains", desc: "Primary targets" },
              { label: "Subdomains", desc: "Discovered hosts" },
              { label: "IP Assets", desc: "Resolved addresses" },
              { label: "Web Exposure", desc: "Open services" },
              { label: "Security Review", desc: "Structured workspace" },
            ].map((item) => (
              <div
                key={item.label}
                className="text-center p-4 bg-navy-900/60 rounded-lg border border-cyan-500/15"
              >
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <span className="text-cyan-400 text-sm">&#9671;</span>
                </div>
                <p className="text-sm text-gray-200 font-medium">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-2">
          Choose Your Access Level
        </h2>
        <p className="text-center text-gray-400 mb-10">
          Start as a Hunter for focused recon or use Company access for broader
          external visibility.
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-10">
          <div className="bg-navy-800/60 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-8 hover:border-cyan-500/40 transition-colors">
            <span className="inline-block px-3 py-1 text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full mb-4">
              Regular Access
            </span>
            <h3 className="text-xl font-bold text-white mb-1">Hunters</h3>
            <p className="text-gray-400 text-sm mb-6">
              For individual learners and focused recon users.
            </p>
            <ul className="space-y-2 text-sm text-gray-300 mb-8">
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">&#10003;</span> Domain and
                subdomain focused workspace
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">&#10003;</span> Limited scan
                access
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">&#10003;</span> Basic result
                review
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">&#10003;</span> Support and
                upgrade request
              </li>
            </ul>
            <Link
              href="/signup"
              className="block text-center px-6 py-3 border border-cyan-500/40 text-cyan-400 rounded-md hover:bg-cyan-500/10 transition-colors font-semibold"
            >
              Join as Hunter
            </Link>
          </div>
          <div className="bg-navy-800/60 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-8 shadow-cyan-glow hover:shadow-cyan-glow-lg transition-colors">
            <span className="inline-block px-3 py-1 text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full mb-4">
              Enterprise Access
            </span>
            <h3 className="text-xl font-bold text-white mb-1">Company</h3>
            <p className="text-gray-400 text-sm mb-6">
              For organizations and teams that need broader external visibility.
            </p>
            <ul className="space-y-2 text-sm text-gray-300 mb-8">
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">&#10003;</span> Broader target
                coverage
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">&#10003;</span> Company-level
                reconnaissance workspace
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">&#10003;</span> Advanced result
                review
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">&#10003;</span> Larger usage
                access
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cyan-400">&#10003;</span> Support
                messaging
              </li>
            </ul>
            <Link
              href="/signup"
              className="block text-center px-6 py-3 bg-cyan-500 text-navy-900 font-semibold rounded-md hover:bg-cyan-400 shadow-cyan-glow transition-colors"
            >
              Join as Company
            </Link>
          </div>
        </div>
      </section>

      <Modal
        open={showPricing}
        onClose={() => setShowPricing(false)}
        title="Subscription Details"
        widthClass="max-w-2xl w-full"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 border border-cyan-500/20 rounded-lg bg-navy-900/40">
            <p className="text-gray-300 font-medium mb-3">Hunter Plan</p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex justify-between">
                <span>Daily Scans</span>
                <span className="text-cyan-300">5</span>
              </li>
              <li className="flex justify-between">
                <span>Crawl Depth</span>
                <span className="text-cyan-300">2</span>
              </li>
              <li className="flex justify-between">
                <span>Port Scan</span>
                <span className="text-cyan-300">Top 100</span>
              </li>
              <li className="flex justify-between">
                <span>Monthly Host Downloads</span>
                <span className="text-cyan-300">10,000</span>
              </li>
              <li className="flex justify-between">
                <span>CVE Matching</span>
                <span className="text-gray-500">Not Available</span>
              </li>
              <li className="flex justify-between">
                <span>Target Types</span>
                <span className="text-cyan-300">Domain, Subdomain</span>
              </li>
            </ul>
          </div>
          <div className="p-4 border border-cyan-500/40 rounded-lg bg-navy-900/40">
            <p className="text-gray-300 font-medium mb-3">Company Plan</p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex justify-between">
                <span>Daily Scans</span>
                <span className="text-cyan-300">20</span>
              </li>
              <li className="flex justify-between">
                <span>Crawl Depth</span>
                <span className="text-cyan-300">3</span>
              </li>
              <li className="flex justify-between">
                <span>Port Scan</span>
                <span className="text-cyan-300">Top 100 & 1000</span>
              </li>
              <li className="flex justify-between">
                <span>Monthly Host Downloads</span>
                <span className="text-cyan-300">1,000,000</span>
              </li>
              <li className="flex justify-between">
                <span>CVE Matching</span>
                <span className="text-green-400">Available</span>
              </li>
              <li className="flex justify-between">
                <span>Target Types</span>
                <span className="text-cyan-300">
                  Domain, Subdomain, IP, CIDR
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Modal>

      <footer className="border-t border-cyan-500/15 bg-navy-900/60 py-10">
        <div className="text-center text-xs text-gray-500">
          <p className="text-cyan-400 font-mono font-bold text-lg mb-1">
            recon-forge
          </p>
          <p>Cyber Recon Platform</p>
        </div>
      </footer>
    </div>
  );
}

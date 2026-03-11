"use client";

import React, { useEffect, useRef } from "react";

type BentoItemProps = {
  className?: string;
  children: React.ReactNode;
};

const BentoItem = ({ className = "", children }: BentoItemProps) => {
  const itemRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const item = itemRef.current;
    if (!item) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = item.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      item.style.setProperty("--mouse-x", `${x}px`);
      item.style.setProperty("--mouse-y", `${y}px`);
    };

    const rect = item.getBoundingClientRect();
    item.style.setProperty("--mouse-x", `${rect.width / 2}px`);
    item.style.setProperty("--mouse-y", `${rect.height / 2}px`);
    item.addEventListener("mousemove", handleMouseMove);

    return () => {
      item.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div ref={itemRef} className={`bento-item ${className}`}>
      {children}
    </div>
  );
};

export const CyberneticBentoGrid = () => {
  return (
    <div className="main-container">
      <div className="w-full max-w-6xl z-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-white text-center mb-8">
          Core Features
        </h1>
        <div className="bento-grid">
          <BentoItem className="col-span-2 row-span-2 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Real-time Analytics</h2>
              <p className="mt-2 text-gray-400">
                Monitor your application&apos;s performance with up-to-the-second data
                streams and visualizations.
              </p>
            </div>
            <div className="mt-4 h-48 bg-neutral-800 rounded-lg flex items-center justify-center text-gray-500 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1551281044-8b5bdc2d8f5e?auto=format&fit=crop&w=1600&q=80"
                alt="Analytics chart panel"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </BentoItem>
          <BentoItem>
            <h2 className="text-xl font-bold text-white">Global CDN</h2>
            <p className="mt-2 text-gray-400 text-sm">
              Deliver content at lightning speed, no matter where your users are.
            </p>
          </BentoItem>
          <BentoItem>
            <h2 className="text-xl font-bold text-white">Secure Auth</h2>
            <p className="mt-2 text-gray-400 text-sm">
              Enterprise-grade authentication and user management built-in.
            </p>
          </BentoItem>
          <BentoItem className="row-span-2">
            <h2 className="text-xl font-bold text-white">Automated Backups</h2>
            <p className="mt-2 text-gray-400 text-sm">
              Your data is always safe with automated, redundant backups.
            </p>
          </BentoItem>
          <BentoItem className="col-span-2">
            <h2 className="text-xl font-bold text-white">Serverless Functions</h2>
            <p className="mt-2 text-gray-400 text-sm">
              Run your backend code without managing servers. Scale infinitely with
              ease.
            </p>
          </BentoItem>
          <BentoItem>
            <h2 className="text-xl font-bold text-white">CLI Tool</h2>
            <p className="mt-2 text-gray-400 text-sm">
              Manage your entire infrastructure from the command line.
            </p>
          </BentoItem>
        </div>
      </div>
    </div>
  );
};

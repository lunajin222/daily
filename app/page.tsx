'use client';
import Image from "next/image";
import { BookOpenCheck } from "lucide-react";
import React, { useState } from "react";
import Card from "@/components/Card";

export default function Home() {
  const [email, setEmail] =useState('');

  // const [isSubscribed, setIsSubscribed] = React.useState(false);

  const handleSubscribe = () => {
    fetch('/api/subscribe', {
      method:'POST',
      body: JSON.stringify({ email }),
    })
  };
  return (
    <div className="min-h-screen bg-white">
      {/* header */}
      <header className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <BookOpenCheck/>
          <h1 className="text-2xl font-bold">Daily News</h1>
        </div>
        <nav className="flex items-center gap-6">
          <a href="/" className="hover:text-gray-600">About</a>
          <a href="/" className="hover:text-gray-600">Contact</a>
        </nav>
      </header>
      {/* main content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* title */}
        <div className='text-center mb-16'>
          <h2 className="text-5xl font-bold mb-6">Welcome to Daily News</h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Stay updated with the latest news and updates from around the world. Our platform provides you with reliable and timely information to keep you informed.
          </p>
        </div>
        {/* input and subscribe button */}
        <div className='text-center flex items-center justify-center gap-4'>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-black" />
          <button onClick={handleSubscribe} className="bg-black text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors">Subscribe</button>
        </div>
        {/* cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          <Card title="AI" description="Stay updated with the latest AI developments and applications." />
          <Card title="Startups" description="Get insights into the latest startup news and funding announcements." />
          <Card title="Tech" description="Get insights into the latest technology trends and innovations." />
        </div>

      </div>
    </div>
  );
}

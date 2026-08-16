'use client';

import React from 'react';

export default function Loading() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#090e0c', // خلفية داكنة مائلة للخضار الملكي
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 99999,
      fontFamily: '"Cairo", sans-serif',
      overflow: 'hidden',
    }}>
      {/* هالات الإضاءة المتحركة الخلفية (Ambient Floating Glow Orbs) */}
      <div className="glow-orb orb-1" />
      <div className="glow-orb orb-2" />

      {/* حاوية الشعار التفاعلية البارزة */}
      <div className="logo-container">
        <img 
          src="/شعار بلدي الرسمي.png" 
          alt="شعار بلدي" 
          className="logo-img"
        />
      </div>

      {/* شريط التحميل بتصميم زجاجي عصري (Glassmorphic Progress Bar Container) */}
      <div className="progress-container">
        <div className="progress-bar-fill" />
      </div>

      {/* النص التفاعلي الشفاف */}
      <div className="loading-text-container">
        <h3 className="loading-text">
          جاري تهيئة لوحة التحكم
          <span className="loading-dots">...</span>
        </h3>
      </div>

      {/* التأثيرات الرسومية البحتة باستخدام كود CSS القياسي لضمان التوافق المطلق */}
      <style dangerouslySetInnerHTML={{ __html: `
        .glow-orb {
          position: absolute;
          width: 450px;
          height: 450px;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
        }
        .orb-1 {
          top: -15%;
          right: -15%;
          background: radial-gradient(circle, rgba(0, 116, 113, 0.18) 0%, transparent 70%);
          animation: floatOrb1 8s ease-in-out infinite alternate;
        }
        .orb-2 {
          bottom: -15%;
          left: -15%;
          background: radial-gradient(circle, rgba(127, 188, 3, 0.14) 0%, transparent 70%);
          animation: floatOrb2 10s ease-in-out infinite alternate-reverse;
        }

        .logo-container {
          margin-bottom: 2.5rem;
          z-index: 2;
          animation: softPulse 2.2s ease-in-out infinite;
        }
        .logo-img {
          width: 160px;
          height: auto;
          filter: drop-shadow(0 15px 35px rgba(0, 116, 113, 0.35));
        }

        .progress-container {
          width: 280px;
          height: 8px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          z-index: 2;
        }

        .progress-bar-fill {
          position: absolute;
          top: 0;
          right: 0;
          height: 100%;
          background: linear-gradient(90deg, #7fbc03 0%, #007471 100%);
          border-radius: 20px;
          box-shadow: 0 0 14px rgba(127, 188, 3, 0.65);
          width: 0%;
          animation: fillProgress 3.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .loading-text-container {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 2;
        }
        .loading-text {
          color: rgba(255, 255, 255, 0.45);
          font-weight: 600;
          font-size: 0.92rem;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .loading-dots {
          display: inline-block;
          animation: dotShimmer 1.5s infinite;
        }

        @keyframes floatOrb1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(25px, -25px) scale(1.08); }
        }
        @keyframes floatOrb2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-25px, 25px) scale(1.08); }
        }
        @keyframes softPulse {
          0%, 100% { 
            transform: scale(1); 
            filter: drop-shadow(0 15px 35px rgba(0, 116, 113, 0.25)); 
          }
          50% { 
            transform: scale(0.96); 
            filter: drop-shadow(0 15px 40px rgba(127, 188, 3, 0.35)); 
          }
        }
        @keyframes fillProgress {
          0% { width: 0%; }
          15% { width: 25%; }
          45% { width: 60%; }
          75% { width: 85%; }
          95% { width: 95%; }
          100% { width: 98%; }
        }
        @keyframes dotShimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}} />
    </div>
  );
}

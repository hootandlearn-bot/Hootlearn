import React from 'react';
import { Link } from 'react-router-dom';
import { Cloud, Star, Sparkles, Rocket, Puzzle, Lightbulb, BookOpen } from 'lucide-react';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="hero-container" id="home">
      <div className="hero-playground">
        
        {/* Floating Background Sketch Elements - breaking out of the box */}
        <div className="hero-decorations">
          <Cloud size={90} className="floating-element cloud-1" strokeWidth={1} />
          <Cloud size={140} className="floating-element cloud-2" strokeWidth={1} />
          <Star size={45} className="floating-element star-1" strokeWidth={1.5} />
          <Sparkles size={55} className="floating-element star-2" strokeWidth={1.5} />
          <Rocket size={65} className="floating-element rocket-1" strokeWidth={1.5} />
        </div>

        <div className="hero-text-bubble">
          <h1 className="hero-title">
            Built on Wonder. Rooted in Process
          </h1>
          



          <div style={{ width: '100%', maxWidth: '500px', marginTop: '20px' }}>
            <img src="/assets/explore.jpeg" alt="Hands Mind Heart" className="hero-explore-img" style={{ width: '100%', height: 'auto' }} />
            <div style={{ display: 'flex', width: '100%', marginTop: '5px' }}>
              <div style={{ flex: 1, textAlign: 'center', fontWeight: '800', fontSize: '1.2rem', color: '#9333EA', fontFamily: "'Fredoka', sans-serif" }}>Hands</div>
              <div style={{ flex: 1, textAlign: 'center', fontWeight: '800', fontSize: '1.2rem', color: '#9333EA', fontFamily: "'Fredoka', sans-serif" }}>Mind</div>
              <div style={{ flex: 1, textAlign: 'center', fontWeight: '800', fontSize: '1.2rem', color: '#9333EA', fontFamily: "'Fredoka', sans-serif" }}>Heart</div>
            </div>
            <p style={{ color: '#A855F7', fontSize: '1.1rem', fontStyle: 'italic', textAlign: 'center', marginTop: '10px' }}>
              Experiences that engage the whole child
            </p>
          </div>
        </div>

        <div className="hero-child-anchor">
          <img src="/assets/hero_sketch_child.jpeg" alt="Whimsical astronaut child" className="hero-main-img" />
        </div>

      </div>
    </section>
  );
};

export default HeroSection;

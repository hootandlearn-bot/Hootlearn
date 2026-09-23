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
          <img src="/assets/hero_owl_sketch.jpg" alt="Owl Sketch" className="floating-element owl-sketch" />
          <Cloud size={90} className="floating-element cloud-1" strokeWidth={1} />
          <Cloud size={140} className="floating-element cloud-2" strokeWidth={1} />
          <Star size={45} className="floating-element star-1" strokeWidth={1.5} />
          <Sparkles size={55} className="floating-element star-2" strokeWidth={1.5} />
          <Rocket size={65} className="floating-element rocket-1" strokeWidth={1.5} />
        </div>

        <div className="hero-text-bubble">
          <h1 className="hero-title">
            The <span className="highlight-red">Transformative</span> Journey <br /> 
            of Experiential Learning In India
          </h1>
          
          <p className="hero-subtitle">
            Take the <span className="highlight-blue">FIRST STEP!</span>
          </p>

          <Link to="/dashboard" className="hero-btn">
            Explore Our Programs
            <span className="arrow">→</span>
          </Link>

          {/* Feature Badges */}
          <div className="hero-badges">
            <div className="hero-badge">
              <div className="badge-icon"><Puzzle size={24} /></div>
              <span>Integrated<br/>Curriculum</span>
            </div>
            <div className="hero-badge">
              <div className="badge-icon"><Lightbulb size={24} /></div>
              <span>Experiential<br/>Approach</span>
            </div>
            <div className="hero-badge">
              <div className="badge-icon"><BookOpen size={24} /></div>
              <span>Interactive<br/>Learning</span>
            </div>
          </div>
        </div>

        <div className="hero-child-anchor">
          <img src="/assets/hero_sketch_child.jpg" alt="Whimsical astronaut child" className="hero-main-img" />
        </div>

      </div>
    </section>
  );
};

export default HeroSection;

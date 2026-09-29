import React from 'react';
import { Lightbulb, Hand, Star, Brain, Users, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import './SpecialFeatures.css';

const features = [
  {
    icon: <Lightbulb size={28} color="#f59e0b" />,
    iconBg: '#fef3c7',
    title: 'Sparks Curiosity',
    desc: 'Encourages children to explore, wonder, question and discover the world around them.'
  },
  {
    icon: <Hand size={28} color="#22c55e" />,
    iconBg: '#dcfce7',
    title: 'Discover & Do',
    desc: 'Learning comes alive through hands-on, experiential and meaningful experiences.'
  },
  {
    icon: <Star size={28} color="#ef4444" />,
    iconBg: '#fee2e2',
    title: 'Builds Independence',
    desc: 'Helps children take ownership of their learning and develop responsibility.'
  },
  {
    icon: <Brain size={28} color="#3b82f6" />,
    iconBg: '#dbeafe',
    title: 'Develops Critical Thinkers',
    desc: 'Provides opportunities to observe, analyse, question, evaluate and solve problems.'
  },
  {
    icon: <Users size={28} color="#a855f7" />,
    iconBg: '#f3e8ff',
    title: 'Encourages Collaboration',
    desc: 'Builds teamwork and interpersonal skills through shared learning experiences.'
  },
  {
    icon: <MessageCircle size={28} color="#14b8a6" />,
    iconBg: '#ccfbf1',
    title: 'Develops Confident Communicators',
    desc: 'Helps children express their ideas, thoughts and experiences with confidence.'
  }
];

const SpecialFeatures = () => {
  return (
    <section className="special-container">
      <motion.div 
        className="special-header"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="special-title">
          <span className="title-deco">🌱</span>
          What Makes HOOT Special?
          <span className="title-deco">🌱</span>
        </h2>
        <p className="special-subtitle">We nurture the child, not just the outcome.</p>
      </motion.div>

      <motion.div 
        className="special-grid"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={{
          visible: { transition: { staggerChildren: 0.1 } }
        }}
      >
        {features.map((feature, idx) => (
          <motion.div 
            className="feature-card" 
            key={idx}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
            }}
          >
            <div className="feature-icon" style={{ backgroundColor: feature.iconBg }}>
              {feature.icon}
            </div>
            <h3 className="feature-card-title">{feature.title}</h3>
            <p className="feature-card-desc">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default SpecialFeatures;

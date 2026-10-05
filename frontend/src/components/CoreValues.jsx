import React from 'react';
import { Globe, Users, Leaf, Heart, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import './CoreValues.css';

const values = [
  { icon: <Globe size={32} color="#0284c7" />, label: 'Internationalism' },
  { icon: <Users size={32} color="#db2777" />, label: 'Gender Equality' },
  { icon: <Leaf size={32} color="#16a34a" />, label: 'Environmentalism' },
  { icon: <Heart size={32} color="#ef4444" />, label: 'Kindness' },
  { icon: <ShieldCheck size={32} color="#0d9488" />, label: 'Responsibility &\nSelf-Discipline' }
];

const CoreValues = () => {
  return (
    <section className="values-container">
      <div className="values-bg-blob"></div>
      
      <div className="values-content">
        <motion.div 
          className="values-text-col"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="values-title">Hoot Values</h2>
          
          <div className="values-icons-row">
            {values.map((val, idx) => (
              <div className="value-item" key={idx}>
                <div className="value-icon">{val.icon}</div>
                <span className="value-label">{val.label}</span>
              </div>
            ))}
          </div>

          <p className="values-slogan">HOOT — <span className="slogan-highlight">Let's Hoot & Learn!</span></p>
          
          <div style={{ marginTop: '30px', fontSize: '1.1rem', color: '#44403c', borderTop: '2px dashed #cbd5e1', paddingTop: '20px' }}>
            <h4 style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '10px' }}>Contact Us</h4>
            <p style={{ margin: '5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong>Email:</strong> <a href="mailto:info@hootandlearn.com" style={{ color: '#0f766e', textDecoration: 'none' }}>info@hootandlearn.com</a>
            </p>
            <p style={{ margin: '5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong>Phone:</strong> <a href="tel:+917718096802" style={{ color: '#0f766e', textDecoration: 'none' }}>+91 77180 96802</a>
            </p>
          </div>
        </motion.div>

        <motion.div 
          className="values-image-col"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Using a placeholder for the kids image, user can replace this with actual asset later */}
          <img 
            src="/assets/sketch_mountains.jpg" 
            alt="Mountain sketch illustration" 
            className="values-img" 
          />
        </motion.div>
      </div>
    </section>
  );
};

export default CoreValues;

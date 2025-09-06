import React from 'react';
import './CreativeDisplay.css'; // You'll create this file next

const CreativeDisplay = ({ title, content }) => {
  return (
    <div className="creative-card">
      <h3 className="creative-title">{title}</h3>
      <p className="creative-content">{content}</p>
    </div>
  );
};

export default CreativeDisplay;

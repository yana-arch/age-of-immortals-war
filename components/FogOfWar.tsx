import React from 'react';

interface VisionSource {
  position: number; // in % of battlefield width
  radius: number;   // in % of battlefield width
}

interface FogOfWarProps {
  visionSources: VisionSource[];
}

const FogOfWar: React.FC<FogOfWarProps> = ({ visionSources }) => {
  // We create a CSS mask with radial gradients.
  // Each gradient creates a transparent circle (a "hole" in the fog) at a vision source's location.
  // The 'add' composite mode ensures that overlapping circles merge to create a larger visible area.
  const maskValue = visionSources
    .map(source => 
        // Create a transparent circle with a slightly feathered edge for a smoother look.
        `radial-gradient(circle at ${source.position}% 50%, transparent ${source.radius * 0.7}%, black ${source.radius}%)`
    )
    .join(',');

  const style: React.CSSProperties = {
    maskImage: maskValue,
    WebkitMaskImage: maskValue,
    maskComposite: 'add',
    WebkitMaskComposite: 'lighter', // 'lighter' is the equivalent of 'add' for WebKit
  };

  return (
    <div 
      className="absolute inset-0 z-20 bg-black/90 pointer-events-none"
      style={style}
    />
  );
};

export default FogOfWar;

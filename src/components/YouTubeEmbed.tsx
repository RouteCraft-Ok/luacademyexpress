import React from 'react';

export const YouTubeEmbed = ({ videoId }: { videoId: string }) => {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '100%',
        aspectRatio: '16 / 9',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
        backgroundColor: '#000000',
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?controls=1&playsinline=1&rel=0&modestbranding=1`}
        title="YouTube"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        style={{
          border: 'none',
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
};
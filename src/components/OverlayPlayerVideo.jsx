import React, { useEffect, useRef, useState } from "react";
import RealTimePlayerDetection from './RealTimePlayerDetection';
import TensorFlowPlayerDetection from './TensorFlowPlayerDetection';

function Tooltip({ x, y, content }) {
  if (!content) return null;
  const style = {
    position: "absolute",
    left: x + 10, top: y + 10,
    background: "rgba(0,0,0,0.80)", color: "white",
    padding: "10px 12px", borderRadius: 10, fontSize: 12,
    maxWidth: 280, lineHeight: 1.35, pointerEvents: "none", zIndex: 30,
    boxShadow: "0 10px 20px rgba(0,0,0,0.25)"
  };
  return (
    <div style={style}>
      <div style={{fontWeight:700, marginBottom:6}}>{content.title}</div>
      {content.lines.map((l,i)=><div key={i}>{l}</div>)}
    </div>
  );
}

export default function OverlayPlayerVideo() {
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const [overlay, setOverlay] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [dim, setDim] = useState({w: 800, h: 450}); // Reduced from 1280x720
  const [tip, setTip] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [detectionMethod, setDetectionMethod] = useState('tensorflow'); // 'tensorflow', 'motion', or 'static'
  const [videoScale, setVideoScale] = useState(0.55); // Video scaling factor - increased default

  useEffect(() => {
    fetch("overlay.json").then(r=>r.json()).then(data => {
      setOverlay(data);
      // Scale video based on videoScale state
      setDim({
        w: Math.round(data.video.width * videoScale), 
        h: Math.round(data.video.height * videoScale)
      });
    });
  }, [videoScale]);

  useEffect(() => {
    if (!overlay) return;
    let raf;
    const tick = () => {
      const v = videoRef.current;
      if (v && !v.paused && !v.ended) {
        const t = v.currentTime;
        // Find the closest frame based on timestamp
        let best = overlay.frames[0], min = 1e9, bestIndex = 0;
        for (let i = 0; i < overlay.frames.length; i++) {
          const fr = overlay.frames[i];
          const d = Math.abs(fr.t - t);
          if (d < min) { 
            min = d; 
            best = fr;
            bestIndex = i;
          }
        }
        setBoxes(best.boxes || []);
        setCurrentTime(t);
        setCurrentFrame(bestIndex);
      }
      raf = requestAnimationFrame(tick);
    };
    
    // Start the animation loop
    raf = requestAnimationFrame(tick);
    
    // Also update on video events
    const video = videoRef.current;
    if (video) {
      const updateBoxes = () => {
        const t = video.currentTime;
        let best = overlay.frames[0], min = 1e9, bestIndex = 0;
        for (let i = 0; i < overlay.frames.length; i++) {
          const fr = overlay.frames[i];
          const d = Math.abs(fr.t - t);
          if (d < min) { 
            min = d; 
            best = fr;
            bestIndex = i;
          }
        }
        setBoxes(best.boxes || []);
        setCurrentTime(t);
        setCurrentFrame(bestIndex);
      };
      
      video.addEventListener('timeupdate', updateBoxes);
      video.addEventListener('seeked', updateBoxes);
      video.addEventListener('play', updateBoxes);
      
      return () => {
        cancelAnimationFrame(raf);
        video.removeEventListener('timeupdate', updateBoxes);
        video.removeEventListener('seeked', updateBoxes);
        video.removeEventListener('play', updateBoxes);
      };
    }
    
    return () => cancelAnimationFrame(raf);
  }, [overlay]);

  const styleWrap = {
    position: "relative",
    width: dim.w, height: dim.h,
    maxWidth: '100%', // Prevent overflow
    borderRadius: 16, overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
    margin: '0 auto', // Center the video
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000'
  };
  const boxStyle = (b) => {
    // Scale box positions to match scaled video
    const scale = overlay ? (dim.w / overlay.video.width) : 0.6;
    return {
      position: "absolute",
      left: Math.round(b.x * scale), 
      top: Math.round(b.y * scale), 
      width: Math.round(b.w * scale), 
      height: Math.round(b.h * scale),
      border: "3px solid rgba(0, 200, 255, 0.95)",
      borderRadius: 8, cursor: "pointer",
      boxShadow: "0 0 15px rgba(0,200,255,0.6), 0 0 30px rgba(0,200,255,0.3)",
      zIndex: 20,
      transition: "all 0.1s ease-out", // Smooth movement
      backgroundColor: "rgba(0, 200, 255, 0.1)",
      backdropFilter: "blur(2px)"
    };
  };

  const onEnter = (e, b) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    const p = b.player;
    const title = p?.name ? `${p.name}  #${p.number}` : (b.number != null ? `Jersey #${b.number}` : "Detecting…");
    const lines = [];
    if (p?.position) lines.push(`Position: ${p.position}`);
    if (p?.height)   lines.push(`Height: ${p.height}`);
    if (p?.weight)   lines.push(`Weight: ${p.weight}`);
    if (p?.college)  lines.push(`College: ${p.college}`);
    if (b.conf != null) lines.push(`Number confidence: ${(b.conf*100).toFixed(0)}%`);
    if (!p) lines.push("No roster match (update roster.py).");
    setTip({x:px, y:py, content:{title, lines}});
  };
  const onMove = (e) => {
    if (!tip) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setTip(t => t && ({...t, x: e.clientX - rect.left, y: e.clientY - rect.top}));
  };
  const onLeave = () => setTip(null);

  return (
    <div>
      <style>{`
        .centered-video {
          position: relative;
        }
        .centered-video video {
          display: block;
          margin: 0 auto;
        }
        .centered-video video::-webkit-media-controls-panel {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0', flexWrap: 'wrap', gap: '10px'}}>
        <h2 style={{fontSize:18, margin:0}}>NFL Player Overlay</h2>
        
        {/* Detection Method Toggle */}
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          {/* Size Controls */}
          <div style={{display: 'flex', gap: '3px', alignItems: 'center'}}>
            <span style={{fontSize: 11, color: '#ccc'}}>Size:</span>
            <button 
              onClick={() => setVideoScale(0.35)}
              style={{
                padding: '3px 5px', fontSize: 9, borderRadius: 3, border: 'none',
                background: videoScale === 0.35 ? '#00ff88' : '#333',
                color: videoScale === 0.35 ? '#000' : '#fff',
                cursor: 'pointer'
              }}
            >
              S
            </button>
            <button 
              onClick={() => setVideoScale(0.55)}
              style={{
                padding: '3px 5px', fontSize: 9, borderRadius: 3, border: 'none',
                background: videoScale === 0.55 ? '#00ff88' : '#333',
                color: videoScale === 0.55 ? '#000' : '#fff',
                cursor: 'pointer'
              }}
            >
              M
            </button>
            <button 
              onClick={() => setVideoScale(0.7)}
              style={{
                padding: '3px 5px', fontSize: 9, borderRadius: 3, border: 'none',
                background: videoScale === 0.7 ? '#00ff88' : '#333',
                color: videoScale === 0.7 ? '#000' : '#fff',
                cursor: 'pointer'
              }}
            >
              L
            </button>
            <button 
              onClick={() => setVideoScale(0.85)}
              style={{
                padding: '3px 5px', fontSize: 9, borderRadius: 3, border: 'none',
                background: videoScale === 0.85 ? '#00ff88' : '#333',
                color: videoScale === 0.85 ? '#000' : '#fff',
                cursor: 'pointer'
              }}
            >
              XL
            </button>
          </div>
          
          <div style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
            <span style={{fontSize: 12, color: '#ccc'}}>Detection:</span>
            <button 
            onClick={() => setDetectionMethod('tensorflow')}
            style={{
              padding: '4px 8px', fontSize: 11, borderRadius: 4, border: 'none',
              background: detectionMethod === 'tensorflow' ? '#00ff88' : '#333',
              color: detectionMethod === 'tensorflow' ? '#000' : '#fff',
              cursor: 'pointer'
            }}
          >
            🤖 AI
          </button>
          <button 
            onClick={() => setDetectionMethod('motion')}
            style={{
              padding: '4px 8px', fontSize: 11, borderRadius: 4, border: 'none',
              background: detectionMethod === 'motion' ? '#ff6600' : '#333',
              color: detectionMethod === 'motion' ? '#fff' : '#fff',
              cursor: 'pointer'
            }}
          >
            📹 Motion
          </button>
          <button 
            onClick={() => setDetectionMethod('static')}
            style={{
              padding: '4px 8px', fontSize: 11, borderRadius: 4, border: 'none',
              background: detectionMethod === 'static' ? '#0066ff' : '#333',
              color: detectionMethod === 'static' ? '#fff' : '#fff',
              cursor: 'pointer'
            }}
          >
            📄 Static
          </button>
          </div>
        </div>
        
        <div style={{fontSize:12, color:'#00ff88', fontFamily:'monospace'}}>
          Time: {currentTime.toFixed(2)}s | Frame: {currentFrame}/{overlay?.frames?.length || 0}
        </div>
      </div>
      <div ref={wrapRef} className="centered-video" style={styleWrap} onMouseMove={onMove}>
        <video 
          ref={videoRef} 
          src="game-video.mp4" 
          width={dim.w} 
          height={dim.h} 
          controls 
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "contain",
            margin: "0 auto",
            position: "relative"
          }}
        />
        {/* Conditional Detection Rendering */}
        {detectionMethod === 'static' && (
          /* Static boxes from JSON */
          boxes.map((b, i) => (
            <div key={i} style={boxStyle(b)} onMouseEnter={(e)=>onEnter(e,b)} onMouseLeave={onLeave}>
              <div style={{position:"absolute", left:0, top:-22, background:"rgba(0,0,0,0.8)",
                           color:"#fff", padding:"2px 6px", borderRadius:6, fontSize:12, fontWeight:700}}>
                {b.player?.name ?? (b.number != null ? `#${b.number}` : "…")}
              </div>
            </div>
          ))
        )}
        
        {detectionMethod === 'tensorflow' && (
          <TensorFlowPlayerDetection videoRef={videoRef} />
        )}
        
        {detectionMethod === 'motion' && (
          <RealTimePlayerDetection videoRef={videoRef} />
        )}
        <Tooltip {...tip}/>
      </div>
      <p style={{opacity:0.7, fontSize:12, marginTop:8}}>
        If boxes drift or names are missing, re-run <code>prepare_overlay.py</code> after updating <code>roster.py</code> or crop/threshold settings.
      </p>
    </div>
  );
}
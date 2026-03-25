import { cn } from '../../lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import React, { useRef, useState, useEffect } from 'react'

// EML brand colors used throughout:
//   Beam body:      #47C9F3 (cyan)  → #ECECEC (light gray)  → transparent
//   Explosion flash: via #47C9F3
//   Particles:      #47C9F3 → #FFFFFF

export function BackgroundBeamsWithCollision({ children, className, style }) {
  const containerRef = useRef(null)
  const parentRef    = useRef(null)

  const beams = [
    { initialX: 10,   translateX: 10,   duration: 7,  repeatDelay: 3,  delay: 2 },
    { initialX: 600,  translateX: 600,  duration: 3,  repeatDelay: 3,  delay: 4 },
    { initialX: 100,  translateX: 100,  duration: 7,  repeatDelay: 7 },
    { initialX: 400,  translateX: 400,  duration: 5,  repeatDelay: 14, delay: 4 },
    { initialX: 800,  translateX: 800,  duration: 11, repeatDelay: 2,  className: 'h-20' },
    { initialX: 1000, translateX: 1000, duration: 4,  repeatDelay: 2,  className: 'h-12' },
    { initialX: 1200, translateX: 1200, duration: 6,  repeatDelay: 4,  delay: 2, className: 'h-6' },
  ]

  return (
    <div
      ref={parentRef}
      className={cn('relative overflow-hidden', className)}
      style={style}
    >
      {beams.map((beam) => (
        <CollisionMechanism
          key={beam.initialX + 'beam-idx'}
          beamOptions={beam}
          containerRef={containerRef}
          parentRef={parentRef}
        />
      ))}

      {children}

      {/* Collision surface at the bottom of the container */}
      <div
        ref={containerRef}
        className="absolute bottom-0 inset-x-0 pointer-events-none"
        style={{ height: '1px', background: 'rgba(71, 201, 243, 0.08)' }}
      />
    </div>
  )
}

// ── CollisionMechanism ────────────────────────────────────────────────────────

const CollisionMechanism = React.forwardRef(({ parentRef, containerRef, beamOptions = {} }, _ref) => {
  const beamRef = useRef(null)
  const [collision, setCollision] = useState({ detected: false, coordinates: null })
  const [beamKey, setBeamKey]     = useState(0)
  const [cycleDetected, setCycleDetected] = useState(false)

  useEffect(() => {
    const check = () => {
      if (!beamRef.current || !containerRef.current || !parentRef.current || cycleDetected) return

      const beamRect      = beamRef.current.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()
      const parentRect    = parentRef.current.getBoundingClientRect()

      if (beamRect.bottom >= containerRect.top) {
        const x = beamRect.left - parentRect.left + beamRect.width / 2
        const y = beamRect.bottom - parentRect.top
        setCollision({ detected: true, coordinates: { x, y } })
        setCycleDetected(true)
      }
    }

    const interval = setInterval(check, 50)
    return () => clearInterval(interval)
  }, [cycleDetected, containerRef])

  useEffect(() => {
    if (collision.detected && collision.coordinates) {
      const t1 = setTimeout(() => {
        setCollision({ detected: false, coordinates: null })
        setCycleDetected(false)
      }, 2000)
      const t2 = setTimeout(() => setBeamKey((k) => k + 1), 2000)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [collision])

  return (
    <>
      <motion.div
        key={beamKey}
        ref={beamRef}
        initial={{
          translateY: beamOptions.initialY ?? '-200px',
          translateX: beamOptions.initialX ?? '0px',
          rotate: beamOptions.rotate ?? 0,
        }}
        animate={{
          translateY: beamOptions.translateY ?? '1800px',
          translateX: beamOptions.translateX ?? '0px',
          rotate: beamOptions.rotate ?? 0,
        }}
        transition={{
          duration:    beamOptions.duration    ?? 8,
          repeat:      Infinity,
          repeatType:  'loop',
          ease:        'linear',
          delay:       beamOptions.delay       ?? 0,
          repeatDelay: beamOptions.repeatDelay ?? 0,
        }}
        className={cn(
          // Beam: cyan tip → light gray body → transparent top
          'absolute left-0 top-20 m-auto h-14 w-px rounded-full',
          'bg-gradient-to-t from-[#47C9F3] via-[#ECECEC]/30 to-transparent',
          beamOptions.className
        )}
      />

      <AnimatePresence>
        {collision.detected && collision.coordinates && (
          <Explosion
            key={`${collision.coordinates.x}-${collision.coordinates.y}`}
            style={{
              position:  'absolute',
              left:      `${collision.coordinates.x}px`,
              top:       `${collision.coordinates.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
})

CollisionMechanism.displayName = 'CollisionMechanism'

// ── Explosion ─────────────────────────────────────────────────────────────────

function Explosion({ style }) {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    dx: Math.floor(Math.random() * 80 - 40),
    dy: Math.floor(Math.random() * -50 - 10),
  }))

  return (
    <div className="absolute z-50 h-2 w-2" style={style}>
      {/* Horizontal flash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute -inset-x-10 top-0 m-auto h-2 w-10 rounded-full blur-sm"
        style={{ background: 'linear-gradient(90deg, transparent, #47C9F3, transparent)' }}
      />

      {/* Scatter particles */}
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: p.dx, y: p.dy, opacity: 0 }}
          transition={{ duration: Math.random() * 1.5 + 0.5, ease: 'easeOut' }}
          className="absolute h-1 w-1 rounded-full"
          style={{ background: 'linear-gradient(to bottom, #47C9F3, #FFFFFF)' }}
        />
      ))}
    </div>
  )
}

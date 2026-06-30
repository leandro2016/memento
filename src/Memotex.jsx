import { useState, useEffect, useCallback } from 'react'

/* =========================================================================
   PHOTOS — REPLACE THESE WITH YOUR OWN 8 IMAGES
   -------------------------------------------------------------------------
   To use your own photos (e.g. Argentinian football players):
   1. Drop your image files into the `public/cards/` folder
      (e.g. public/cards/messi.jpg, public/cards/maradona.png, ...)
   2. Update the `src` values in the IMAGES array below to point to them,
      e.g. { id: 1, src: '/cards/messi.jpg', label: 'Messi' }
   Each entry is used exactly twice (a matching pair). Keep exactly 16 entries
   for a 4x8 board (32 cards). You have 16 photos in /figus — all are used.
   ========================================================================= */
const BASE = import.meta.env.BASE_URL // '/memento/' in prod, '/' in dev
const img = (file) => `${BASE}cards/${file}`

const IMAGES = [
  { id: 1, src: img('1.JPG'), label: 'Card 1' },
  { id: 2, src: img('2.JPG'), label: 'Card 2' },
  { id: 3, src: img('3.JPG'), label: 'Card 3' },
  { id: 4, src: img('4.PNG'), label: 'Card 4' },
  { id: 5, src: img('5.PNG'), label: 'Card 5' },
  { id: 6, src: img('6.JPG'), label: 'Card 6' },
  { id: 7, src: img('7.JPG'), label: 'Card 7' },
  { id: 8, src: img('8.JPG'), label: 'Card 8' },
  { id: 9, src: img('9.JPG'), label: 'Card 9' },
  { id: 10, src: img('10.JPG'), label: 'Card 10' },
  { id: 11, src: img('11.JPG'), label: 'Card 11' },
  { id: 12, src: img('12.JPG'), label: 'Card 12' },
  { id: 13, src: img('13.JPG'), label: 'Card 13' },
  { id: 14, src: img('14.JPG'), label: 'Card 14' },
  { id: 15, src: img('15.JPG'), label: 'Card 15' },
  { id: 16, src: img('16.JPG'), label: 'Card 16' },
]

const TOTAL_PAIRS = IMAGES.length // 16 available images

/* ---- Board size options: how many pairs to play with ---- */
const SIZES = [
  { id: 8, label: '🐣 8 pairs', pairs: 8, cols: 4 },   // 16 cards, 4x4
  { id: 12, label: '🧒 12 pairs', pairs: 12, cols: 6 }, // 24 cards, 4x6
  { id: 16, label: '🚀 16 pairs', pairs: 16, cols: 8 }, // 32 cards, 4x8
]

/* ---- Difficulty levels: peek time (how long unmatched cards stay face-up) ---- */
const LEVELS = [
  { id: 'easy', label: '🐣 Easy', peekMs: 1800, matchMs: 600 },
  { id: 'normal', label: '🧒 Normal', peekMs: 1300, matchMs: 450 },
  { id: 'hard', label: '🚀 Hard', peekMs: 800, matchMs: 300 },
]

/* ---- Preview phase options: how long to flash all cards at start ---- */
const PREVIEWS = [
  { id: 0, label: '🚫 Off' },
  { id: 3, label: '⏱️ 3s' },
  { id: 5, label: '⏱️ 5s' },
  { id: 8, label: '⏱️ 8s' },
]

/* ---- Card back designs ---- */
const BACKS = [
  { id: 'question', icon: '❓', label: '❓' },
  { id: 'ball', icon: '⚽', label: '⚽' },
  { id: 'rainbow', icon: '🌈', label: '🌈' },
  { id: 'star', icon: '⭐', label: '⭐' },
  { id: 'magic', icon: '🔮', label: '🔮' },
]

/* ---- Themes: background gradient + accent colors ---- */
const THEMES = [
  { id: 'ocean', label: '🌊 Ocean', bg: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)', accent: '#118ab2' },
  { id: 'jungle', label: '🌴 Jungle', bg: 'linear-gradient(135deg, #d4f1d4 0%, #a8e6a1 100%)', accent: '#06d6a0' },
  { id: 'sunset', label: '🌅 Sunset', bg: 'linear-gradient(135deg, #fef9f3 0%, #ffd6a5 100%)', accent: '#ef476f' },
  { id: 'space', label: '🚀 Space', bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', accent: '#8338ec' },
]

/* ---- Helpers ---- */
function shuffle(array) {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildDeck(pairCount = TOTAL_PAIRS) {
  // Use the first `pairCount` images, each appears twice
  const selected = IMAGES.slice(0, pairCount)
  const doubled = [...selected, ...selected].map((img, idx) => ({
    uid: idx,
    imageId: img.id,
    src: img.src,
    label: img.label,
  }))
  return shuffle(doubled)
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function ratingFor(moves, pairs) {
  // Perfect = pairs moves; allow some slack
  const perfect = pairs
  if (moves <= perfect + 4) return '🏆 Memory Master!'
  if (moves <= perfect + 10) return '🌟 Great job!'
  if (moves <= perfect + 20) return '👍 Well done!'
  return '😊 Good try!'
}

/* =========================================================================
   MAIN COMPONENT
   ========================================================================= */
export default function Memotex() {
  const [screen, setScreen] = useState('start') // 'start' | 'game' | 'end'
  const [mode, setMode] = useState('single') // 'single' | 'two'
  const [level, setLevel] = useState('normal') // 'easy' | 'normal' | 'hard'
  const [size, setSize] = useState(16) // 8 | 12 | 16 pairs
  const [preview, setPreview] = useState(5) // 0 (off) | 3 | 5 | 8 seconds
  const [theme, setTheme] = useState('ocean') // ocean | jungle | sunset | space
  const [cardBack, setCardBack] = useState('question') // question | ball | rainbow | star | magic
  const [players, setPlayers] = useState({ p1: 'Player 1', p2: 'Player 2' })

  const [deck, setDeck] = useState(() => buildDeck(size))
  const [flipped, setFlipped] = useState([]) // uids currently face-up (max 2)
  const [matched, setMatched] = useState([]) // imageIds that are matched
  const [locked, setLocked] = useState(false) // prevent clicks during pause/preview
  const [previewing, setPreviewing] = useState(false) // preview phase
  const [previewLeft, setPreviewLeft] = useState(0) // seconds left in preview
  const [moves, setMoves] = useState(0)
  const [scores, setScores] = useState({ p1: 0, p2: 0 })
  const [turn, setTurn] = useState('p1') // whose turn (two-player)
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)

  const totalPairs = size // active pair count for this game

  // Timer
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  // Detect game over
  useEffect(() => {
    if (screen === 'game' && matched.length === totalPairs) {
      setRunning(false)
      setScreen('end')
    }
  }, [matched, screen, totalPairs])

  // Preview countdown timer
  useEffect(() => {
    if (!previewing) return
    const id = setInterval(() => {
      setPreviewLeft((p) => {
        if (p <= 1) {
          clearInterval(id)
          setPreviewing(false)
          setLocked(false)
          setRunning(true) // start the game timer after preview
          return 0
        }
        return p - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [previewing])

  const startGame = useCallback((selectedMode, selectedLevel, selectedSize, selectedPreview) => {
    const sz = selectedSize || size
    const pv = selectedPreview !== undefined ? selectedPreview : preview
    setMode(selectedMode)
    setLevel(selectedLevel)
    setSize(sz)
    setPreview(pv)
    setDeck(buildDeck(sz))
    setFlipped([])
    setMatched([])
    setMoves(0)
    setScores({ p1: 0, p2: 0 })
    setTurn('p1')
    setElapsed(0)
    setRunning(false)
    if (pv > 0) {
      setLocked(true) // locked during preview
      setPreviewLeft(pv)
      setPreviewing(true)
    } else {
      setLocked(false)
      setPreviewing(false)
      setRunning(true) // no preview — start immediately
    }
    setScreen('game')
  }, [size, preview])

  const newGame = useCallback(() => {
    setDeck(buildDeck(size))
    setFlipped([])
    setMatched([])
    setMoves(0)
    setScores({ p1: 0, p2: 0 })
    setTurn('p1')
    setElapsed(0)
    setRunning(false)
    if (preview > 0) {
      setLocked(true)
      setPreviewLeft(preview)
      setPreviewing(true)
    } else {
      setLocked(false)
      setPreviewing(false)
      setRunning(true)
    }
    setScreen('game')
  }, [size, preview])

  const backToStart = useCallback(() => {
    setRunning(false)
    setScreen('start')
  }, [])

  const handleCardClick = useCallback(
    (card) => {
      if (locked) return
      if (flipped.includes(card.uid)) return
      if (matched.includes(card.imageId)) return
      if (flipped.length >= 2) return

      const nextFlipped = [...flipped, card.uid]
      setFlipped(nextFlipped)

      if (nextFlipped.length === 2) {
        setMoves((m) => m + 1)
        const [aUid, bUid] = nextFlipped
        const a = deck.find((c) => c.uid === aUid)
        const b = deck.find((c) => c.uid === bUid)

        if (a.imageId === b.imageId) {
          // Match!
          const { matchMs } = LEVELS.find((l) => l.id === level)
          setTimeout(() => {
            setMatched((prev) => [...prev, a.imageId])
            setFlipped([])
            setScores((prev) => ({ ...prev, [turn]: prev[turn] + 1 }))
            // same player goes again — no turn switch
          }, matchMs)
        } else {
          // No match
          const { peekMs } = LEVELS.find((l) => l.id === level)
          setLocked(true)
          setTimeout(() => {
            setFlipped([])
            setLocked(false)
            if (mode === 'two') {
              setTurn((t) => (t === 'p1' ? 'p2' : 'p1'))
            }
          }, peekMs)
        }
      }
    },
    [flipped, matched, locked, deck, mode, turn, level],
  )

  /* ---- Render helpers ---- */
  const activeName = mode === 'single' ? players.p1 : turn === 'p1' ? players.p1 : players.p2

  const activeTheme = THEMES.find((t) => t.id === theme) || THEMES[0]

  return (
    <div className="memotex" data-theme={theme} style={{ background: activeTheme.bg }}>
      {/* Animated floating shapes background */}
      <div className="bg-shapes" aria-hidden="true">
        <span className="bg-shape s1" />
        <span className="bg-shape s2" />
        <span className="bg-shape s3" />
        <span className="bg-shape s4" />
        <span className="bg-shape s5" />
      </div>

      {screen === 'start' && (
        <StartScreen
          mode={mode}
          setMode={setMode}
          level={level}
          setLevel={setLevel}
          size={size}
          setSize={setSize}
          preview={preview}
          setPreview={setPreview}
          theme={theme}
          setTheme={setTheme}
          cardBack={cardBack}
          setCardBack={setCardBack}
          players={players}
          setPlayers={setPlayers}
          onStart={startGame}
        />
      )}

      {screen === 'game' && (
        <GameScreen
          deck={deck}
          flipped={flipped}
          matched={matched}
          onCardClick={handleCardClick}
          mode={mode}
          players={players}
          scores={scores}
          turn={turn}
          moves={moves}
          elapsed={elapsed}
          activeName={activeName}
          onNewGame={newGame}
          onExit={backToStart}
          previewing={previewing}
          previewLeft={previewLeft}
          totalPairs={totalPairs}
          size={size}
          cardBack={cardBack}
        />
      )}

      {screen === 'end' && (
        <EndScreen
          mode={mode}
          players={players}
          scores={scores}
          moves={moves}
          elapsed={elapsed}
          totalPairs={totalPairs}
          onPlayAgain={newGame}
          onBackToStart={backToStart}
        />
      )}
    </div>
  )
}

/* =========================================================================
   START SCREEN
   ========================================================================= */
function StartScreen({ mode, setMode, level, setLevel, size, setSize, preview, setPreview, theme, setTheme, cardBack, setCardBack, players, setPlayers, onStart }) {
  return (
    <div className="screen start-screen">
      <h1 className="title">
        🧠 Memotex <span className="title-emoji">🎮</span>
      </h1>
      <p className="subtitle">Find all the matching pairs!</p>

      <div className="mode-buttons">
        <button
          className={`mode-btn ${mode === 'single' ? 'active' : ''}`}
          onClick={() => setMode('single')}
        >
          🧍 Single Player
        </button>
        <button
          className={`mode-btn ${mode === 'two' ? 'active' : ''}`}
          onClick={() => setMode('two')}
        >
          👥 Two Player
        </button>
      </div>

      <div className="level-buttons">
        <span className="level-label">Cards:</span>
        {SIZES.map((s) => (
          <button
            key={s.id}
            className={`level-btn ${size === s.id ? 'active' : ''}`}
            onClick={() => setSize(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="level-buttons">
        <span className="level-label">Speed:</span>
        {LEVELS.map((l) => (
          <button
            key={l.id}
            className={`level-btn ${level === l.id ? 'active' : ''}`}
            onClick={() => setLevel(l.id)}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="level-buttons">
        <span className="level-label">Peek:</span>
        {PREVIEWS.map((p) => (
          <button
            key={p.id}
            className={`level-btn ${preview === p.id ? 'active' : ''}`}
            onClick={() => setPreview(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="level-buttons">
        <span className="level-label">Theme:</span>
        {THEMES.map((t) => (
          <button
            key={t.id}
            className={`level-btn ${theme === t.id ? 'active' : ''}`}
            onClick={() => setTheme(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="level-buttons">
        <span className="level-label">Card back:</span>
        {BACKS.map((b) => (
          <button
            key={b.id}
            className={`level-btn back-btn ${cardBack === b.id ? 'active' : ''}`}
            onClick={() => setCardBack(b.id)}
          >
            {b.label}
          </button>
        ))}
      </div>

      <div className="name-fields">
        <label className="name-label">
          {mode === 'single' ? 'Your name' : 'Player 1 name'}
          <input
            className="name-input"
            type="text"
            value={players.p1}
            maxLength={14}
            onChange={(e) => setPlayers((p) => ({ ...p, p1: e.target.value }))}
            placeholder="Player 1"
          />
        </label>
        {mode === 'two' && (
          <label className="name-label">
            Player 2 name
            <input
              className="name-input"
              type="text"
              value={players.p2}
              maxLength={14}
              onChange={(e) => setPlayers((p) => ({ ...p, p2: e.target.value }))}
              placeholder="Player 2"
            />
          </label>
        )}
      </div>

      <button className="play-btn" onClick={() => onStart(mode, level, size, preview)}>
        ▶️ Play!
      </button>
    </div>
  )
}

/* =========================================================================
   GAME SCREEN
   ========================================================================= */
function GameScreen({
  deck,
  flipped,
  matched,
  onCardClick,
  mode,
  players,
  scores,
  turn,
  moves,
  elapsed,
  activeName,
  onNewGame,
  onExit,
  previewing,
  previewLeft,
  totalPairs,
  size,
  cardBack,
}) {
  const sizeConfig = SIZES.find((s) => s.id === size) || SIZES[2]
  const cols = sizeConfig.cols

  return (
    <div className="screen game-screen">
      <header className="game-header">
        <div className="header-left">
          <button className="icon-btn" onClick={onExit} title="Back to start">
            ⬅️
          </button>
          <button className="icon-btn" onClick={onNewGame} title="New game">
            🔄
          </button>
        </div>
        <div className="header-center">
          {mode === 'single' ? (
            <div className="stat-pill">
              <span>⏱️ {formatTime(elapsed)}</span>
              <span>👆 {moves}</span>
            </div>
          ) : (
            <div className={`turn-banner turn-${turn}`}>
              <span className="turn-label">Turn:</span>
              <span className="turn-name">{activeName}</span>
            </div>
          )}
        </div>
        <div className="header-right">
          {mode === 'single' ? (
            <div className="score-chip">
              <span className="score-name">{players.p1}</span>
              <span className="score-value">🏆 {scores.p1}</span>
            </div>
          ) : (
            <div className="score-pair">
              <div className={`score-chip ${turn === 'p1' ? 'is-active' : ''}`}>
                <span className="score-name">{players.p1}</span>
                <span className="score-value">🏆 {scores.p1}</span>
              </div>
              <div className={`score-chip ${turn === 'p2' ? 'is-active' : ''}`}>
                <span className="score-name">{players.p2}</span>
                <span className="score-value">🏆 {scores.p2}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {previewing ? (
        <div className="preview-banner">
          👀 Memorize the cards! {previewLeft}s
        </div>
      ) : (
        mode === 'two' && (
          <div className={`active-bar active-${turn}`}>
            <span>{activeName}&apos;s turn — pick two cards!</span>
          </div>
        )
      )}

      {/* Progress bar */}
      <div className="progress-wrap">
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${(matched.length / totalPairs) * 100}%` }}
          />
        </div>
        <span className="progress-text">{matched.length}/{totalPairs} pairs</span>
      </div>

      <div
        className="board"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {deck.map((card) => {
          const isFlipped = previewing || flipped.includes(card.uid)
          const isMatched = matched.includes(card.imageId)
          return (
            <Card
              key={card.uid}
              card={card}
              isFlipped={isFlipped}
              isMatched={isMatched}
              isPreview={previewing}
              turnColor={mode === 'two' ? turn : null}
              cardBack={cardBack}
              onClick={() => onCardClick(card)}
            />
          )
        })}
      </div>

      <footer className="game-footer">
        <span className="footer-stat">⏱️ {formatTime(elapsed)}</span>
        <span className="footer-stat">👆 Moves: {moves}</span>
        <span className="footer-stat">✅ Pairs: {matched.length}/{totalPairs}</span>
      </footer>
    </div>
  )
}

/* =========================================================================
   CARD
   ========================================================================= */
function Card({ card, isFlipped, isMatched, isPreview, turnColor, cardBack, onClick }) {
  const backIcon = BACKS.find((b) => b.id === cardBack)?.icon || '❓'
  return (
    <button
      className={`card ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''} ${isPreview ? 'preview' : ''} ${turnColor ? `turn-${turnColor}` : ''}`}
      onClick={onClick}
      disabled={isMatched || isPreview}
      aria-label={isFlipped || isMatched ? card.label : 'Face-down card'}
    >
      <div className="card-inner">
        <div className="card-face card-back">
          <span className="card-back-icon">{backIcon}</span>
        </div>
        <div className="card-face card-front">
          <img src={card.src} alt={card.label} draggable={false} />
        </div>
      </div>
    </button>
  )
}

/* =========================================================================
   END SCREEN
   ========================================================================= */
function EndScreen({ mode, players, scores, moves, elapsed, totalPairs, onPlayAgain, onBackToStart }) {
  let winnerText
  if (mode === 'single') {
    winnerText = ratingFor(moves, totalPairs)
  } else {
    if (scores.p1 > scores.p2) winnerText = `🎉 ${players.p1} wins!`
    else if (scores.p2 > scores.p1) winnerText = `🎉 ${players.p2} wins!`
    else winnerText = "🤝 It's a tie!"
  }

  return (
    <div className="screen end-screen">
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} className="confetti-bit" style={{ '--i': i }} />
        ))}
      </div>

      <h1 className="title">🎊 Game Over! 🎊</h1>
      <p className="winner-text">{winnerText}</p>

      {mode === 'single' ? (
        <div className="result-card">
          <div className="result-row">
            <span>⏱️ Time</span>
            <strong>{formatTime(elapsed)}</strong>
          </div>
          <div className="result-row">
            <span>👆 Moves</span>
            <strong>{moves}</strong>
          </div>
          <div className="result-row">
            <span>🏆 Pairs</span>
            <strong>{scores.p1}/{totalPairs}</strong>
          </div>
        </div>
      ) : (
        <div className="result-card">
          <div className="result-row">
            <span>🏆 {players.p1}</span>
            <strong>{scores.p1} pairs</strong>
          </div>
          <div className="result-row">
            <span>🏆 {players.p2}</span>
            <strong>{scores.p2} pairs</strong>
          </div>
          <div className="result-row">
            <span>👆 Total moves</span>
            <strong>{moves}</strong>
          </div>
          <div className="result-row">
            <span>⏱️ Time</span>
            <strong>{formatTime(elapsed)}</strong>
          </div>
        </div>
      )}

      <div className="end-buttons">
        <button className="play-btn" onClick={onPlayAgain}>
          🔁 Play Again
        </button>
        <button className="secondary-btn" onClick={onBackToStart}>
          🏠 Start Screen
        </button>
      </div>
    </div>
  )
}
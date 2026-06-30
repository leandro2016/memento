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
const IMAGES = [
  { id: 1, src: '/cards/1.JPG', label: 'Card 1' },
  { id: 2, src: '/cards/2.JPG', label: 'Card 2' },
  { id: 3, src: '/cards/3.JPG', label: 'Card 3' },
  { id: 4, src: '/cards/4.PNG', label: 'Card 4' },
  { id: 5, src: '/cards/5.PNG', label: 'Card 5' },
  { id: 6, src: '/cards/6.JPG', label: 'Card 6' },
  { id: 7, src: '/cards/7.JPG', label: 'Card 7' },
  { id: 8, src: '/cards/8.JPG', label: 'Card 8' },
  { id: 9, src: '/cards/9.JPG', label: 'Card 9' },
  { id: 10, src: '/cards/10.JPG', label: 'Card 10' },
  { id: 11, src: '/cards/11.JPG', label: 'Card 11' },
  { id: 12, src: '/cards/12.JPG', label: 'Card 12' },
  { id: 13, src: '/cards/13.JPG', label: 'Card 13' },
  { id: 14, src: '/cards/14.JPG', label: 'Card 14' },
  { id: 15, src: '/cards/15.JPG', label: 'Card 15' },
  { id: 16, src: '/cards/16.JPG', label: 'Card 16' },
]

const TOTAL_PAIRS = IMAGES.length // 8

/* ---- Difficulty levels: how long cards stay face-up before flipping back ---- */
const LEVELS = [
  { id: 'easy', label: '🐣 Easy', peekMs: 1800, matchMs: 600 },
  { id: 'normal', label: '🧒 Normal', peekMs: 1300, matchMs: 450 },
  { id: 'hard', label: '🚀 Hard', peekMs: 800, matchMs: 300 },
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

function buildDeck() {
  // Each image appears twice
  const doubled = [...IMAGES, ...IMAGES].map((img, idx) => ({
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

function ratingFor(moves) {
  if (moves <= 12) return '🏆 Memory Master!'
  if (moves <= 18) return '🌟 Great job!'
  if (moves <= 26) return '👍 Well done!'
  return '😊 Good try!'
}

/* =========================================================================
   MAIN COMPONENT
   ========================================================================= */
export default function Memotex() {
  const [screen, setScreen] = useState('start') // 'start' | 'game' | 'end'
  const [mode, setMode] = useState('single') // 'single' | 'two'
  const [level, setLevel] = useState('normal') // 'easy' | 'normal' | 'hard'
  const [players, setPlayers] = useState({ p1: 'Player 1', p2: 'Player 2' })

  const [deck, setDeck] = useState(() => buildDeck())
  const [flipped, setFlipped] = useState([]) // uids currently face-up (max 2)
  const [matched, setMatched] = useState([]) // imageIds that are matched
  const [locked, setLocked] = useState(false) // prevent clicks during pause
  const [moves, setMoves] = useState(0)
  const [scores, setScores] = useState({ p1: 0, p2: 0 })
  const [turn, setTurn] = useState('p1') // whose turn (two-player)
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)

  // Timer
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  // Detect game over
  useEffect(() => {
    if (screen === 'game' && matched.length === TOTAL_PAIRS) {
      setRunning(false)
      setScreen('end')
    }
  }, [matched, screen])

  const startGame = useCallback((selectedMode, selectedLevel) => {
    setMode(selectedMode)
    setLevel(selectedLevel)
    setDeck(buildDeck())
    setFlipped([])
    setMatched([])
    setLocked(false)
    setMoves(0)
    setScores({ p1: 0, p2: 0 })
    setTurn('p1')
    setElapsed(0)
    setRunning(true)
    setScreen('game')
  }, [])

  const newGame = useCallback(() => {
    setDeck(buildDeck())
    setFlipped([])
    setMatched([])
    setLocked(false)
    setMoves(0)
    setScores({ p1: 0, p2: 0 })
    setTurn('p1')
    setElapsed(0)
    setRunning(true)
    setScreen('game')
  }, [])

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

  return (
    <div className="memotex">
      {screen === 'start' && (
        <StartScreen
          mode={mode}
          setMode={setMode}
          level={level}
          setLevel={setLevel}
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
        />
      )}

      {screen === 'end' && (
        <EndScreen
          mode={mode}
          players={players}
          scores={scores}
          moves={moves}
          elapsed={elapsed}
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
function StartScreen({ mode, setMode, level, setLevel, players, setPlayers, onStart }) {
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
        <span className="level-label">Difficulty:</span>
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

      <button className="play-btn" onClick={() => onStart(mode, level)}>
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
}) {
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
            <div className="turn-banner turn-p1">
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

      {mode === 'two' && (
        <div className={`active-bar active-${turn}`}>
          <span>{activeName}&apos;s turn — pick two cards!</span>
        </div>
      )}

      <div className="board">
        {deck.map((card) => {
          const isFlipped = flipped.includes(card.uid)
          const isMatched = matched.includes(card.imageId)
          return (
            <Card
              key={card.uid}
              card={card}
              isFlipped={isFlipped}
              isMatched={isMatched}
              onClick={() => onCardClick(card)}
            />
          )
        })}
      </div>

      <footer className="game-footer">
        <span className="footer-stat">⏱️ {formatTime(elapsed)}</span>
        <span className="footer-stat">👆 Moves: {moves}</span>
        <span className="footer-stat">✅ Pairs: {matched.length}/{TOTAL_PAIRS}</span>
      </footer>
    </div>
  )
}

/* =========================================================================
   CARD
   ========================================================================= */
function Card({ card, isFlipped, isMatched, onClick }) {
  return (
    <button
      className={`card ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`}
      onClick={onClick}
      disabled={isMatched}
      aria-label={isFlipped || isMatched ? card.label : 'Face-down card'}
    >
      <div className="card-inner">
        <div className="card-face card-back">
          <span className="card-back-icon">❓</span>
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
function EndScreen({ mode, players, scores, moves, elapsed, onPlayAgain, onBackToStart }) {
  let winnerText
  if (mode === 'single') {
    winnerText = ratingFor(moves)
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
            <strong>{scores.p1}/{TOTAL_PAIRS}</strong>
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
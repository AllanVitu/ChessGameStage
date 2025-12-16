<template>
  <main class="container game-layout" v-if="currentMatch">
    <h1>{{ currentMatch.mode === 'bot' ? 'Partie vs IA' : 'Partie locale' }}</h1>

    <section class="card board-panel">
      <div class="players">
        <div>
          <p class="section-title">Blancs</p>
          <p class="player">{{ whitePlayer }}</p>
        </div>
        <div>
          <p class="section-title">Noirs</p>
          <p class="player">{{ blackPlayer }}</p>
        </div>
      </div>
      <p class="status">{{ statusMessage }}</p>
      <p v-if="currentMatch.mode === 'bot'" class="helper ai-label">
        IA {{ currentMatch.botLevel ?? 'normal' }} ({{ currentMatch.color === 'White' ? 'vous' : 'bot' }} joue les
        blancs)
      </p>
      <div class="board-actions">
        <button class="btn" type="button" @click="resetGame" :disabled="isBotThinking">Reinitialiser</button>
        <button class="btn-outline danger" type="button" @click="resign" :disabled="isGameOver">Abandonner</button>
        <button class="btn-outline2" type="button" @click="declareDraw" :disabled="isGameOver">Match nul</button>
        <button class="btn-outline" type="button" @click="backToList">Retour a la liste</button>
      </div>
    </section>

    <section class="card board-shell">
      <div class="board-shell__header">
        <p class="section-title">Plateau</p>
        <p class="helper">Selectionne une piece puis joue sur les cases mises en surbrillance.</p>
      </div>

      <div class="board-wrap">
        <div id="plateau">
          <div class="noir corner"></div>
          <div v-for="file in files" :key="`top-${file}`" class="noir top">
            {{ file.toUpperCase() }}
          </div>
          <div class="noir corner"></div>

          <template v-for="(rankRow, rowIndex) in board" :key="`rank-${ranks[rowIndex]}`">
            <div class="noir side">{{ ranks[rowIndex] }}</div>

            <button
              v-for="(square, fileIndex) in rankRow"
              :key="`${files[fileIndex]}${ranks[rowIndex]}`"
              class="case"
              :class="squareClass(rowIndex, fileIndex, files[fileIndex]!, ranks[rowIndex]!)"
              @click="selectSquare(rowIndex, fileIndex)"
            >
              <span
                v-if="square"
                class="piece"
                :data-piece-color="square.color"
                :data-piece-type="square.type"
              >
                {{ renderPiece(square.color, square.type) }}
              </span>
            </button>

            <div class="noir side">{{ ranks[rowIndex] }}</div>
          </template>

          <div class="noir corner"></div>
          <div v-for="file in files" :key="`bottom-${file}`" class="noir bottom">
            {{ file.toUpperCase() }}
          </div>
          <div class="noir corner"></div>
        </div>
      </div>
    </section>
  </main>
  <main v-else class="container">
    <h1>Partie introuvable</h1>
    <p>La partie demandee n'existe plus. Retourne a la liste.</p>
    <button class="btn" type="button" @click="backToList">Retour</button>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMatchesStore, type Board, type Piece } from '../stores/matches'
import { useUserStore } from '../stores/user'

type Color = 'white' | 'black'
type Move = { from: { row: number; col: number }; to: { row: number; col: number } }

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
const ranks = [8, 7, 6, 5, 4, 3, 2, 1]

const route = useRoute()
const router = useRouter()
const matchesStore = useMatchesStore()
const userStore = useUserStore()
const matchId = route.params.id as string

const board = ref<Board>([])
const turn = ref<Color>('white')
const selected = ref<{ row: number; col: number } | null>(null)
const legalMoves = ref<string[]>([])
const isBotThinking = ref(false)
const statusNote = ref('')

const currentMatch = computed(() => matchesStore.getMatch(matchId))
const humanColor = computed<Color | null>(() => {
  if (!currentMatch.value) return null
  return currentMatch.value.color === 'White' ? 'white' : 'black'
})
const botColor = computed<Color | null>(() => {
  if (!currentMatch.value || currentMatch.value.mode !== 'bot') return null
  return humanColor.value === 'white' ? 'black' : 'white'
})
const isGameOver = computed(() => currentMatch.value?.status === 'finished' || !!currentMatch.value?.result)
const isBotTurn = computed(() => !!botColor.value && turn.value === botColor.value && !isGameOver.value)

const whitePlayer = computed(() => {
  if (!currentMatch.value) return 'Blanc'
  return currentMatch.value.color === 'White'
    ? currentMatch.value.host
    : currentMatch.value.opponent ?? (currentMatch.value.mode === 'bot' ? 'IA' : 'Invite')
})

const blackPlayer = computed(() => {
  if (!currentMatch.value) return 'Noir'
  return currentMatch.value.color === 'Black'
    ? currentMatch.value.host
    : currentMatch.value.opponent ?? (currentMatch.value.mode === 'bot' ? 'IA' : 'Invite')
})

const winnerText = computed(() => {
  const result = currentMatch.value?.result
  if (!result) return ''
  if (result.winner === 'draw') return 'Match nul'
  return result.winner === 'white' ? 'Victoire des blancs' : 'Victoire des noirs'
})

const statusMessage = computed(() => {
  if (isGameOver.value) return `${winnerText.value} (${currentMatch.value?.result?.reason ?? ''})`
  if (statusNote.value) return statusNote.value
  if (isBotThinking.value) return 'IA en reflexion...'
  return turn.value === 'white' ? 'Au tour des blancs' : 'Au tour des noirs'
})

const cloneBoard = (source: Board): Board =>
  source.map((row) => row.map((cell) => (cell ? { ...cell } : null)))

const positionToSquare = (row: number, col: number) => {
  const file = files[col]
  const rank = ranks[row]
  if (file === undefined || rank === undefined) return ''
  return `${file}${rank}`
}

const isInside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8

const syncFromStore = () => {
  if (!currentMatch.value) return
  board.value = cloneBoard(currentMatch.value.board)
  turn.value = currentMatch.value.turn
  statusNote.value = ''
}

const findKing = (state: Board, color: Color) => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = state[r]?.[c]
      if (cell && cell.type === 'k' && cell.color === color) return { row: r, col: c }
    }
  }
  return null
}

const isSquareAttacked = (state: Board, row: number, col: number, byColor: Color) => {
  const knightJumps: Array<[number, number]> = [
    [2, 1],
    [2, -1],
    [-2, 1],
    [-2, -1],
    [1, 2],
    [1, -2],
    [-1, 2],
    [-1, -2],
  ]
  for (const [dr, dc] of knightJumps) {
    const r = row + dr
    const c = col + dc
    if (!isInside(r, c)) continue
    const target = state[r]?.[c]
    if (target && target.color === byColor && target.type === 'n') return true
  }

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const r = row + dr
      const c = col + dc
      if (!isInside(r, c)) continue
      const target = state[r]?.[c]
      if (target && target.color === byColor && target.type === 'k') return true
    }
  }

  const pawnDir = byColor === 'white' ? -1 : 1
  const pawnRows = [
    [row + pawnDir, col - 1],
    [row + pawnDir, col + 1],
  ]
  for (const [r, c] of pawnRows) {
    if (!isInside(r, c)) continue
    const target = state[r]?.[c]
    if (target && target.color === byColor && target.type === 'p') return true
  }

  const lines: Array<[number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]
  for (const [dr, dc] of lines) {
    let r = row + dr
    let c = col + dc
    while (isInside(r, c)) {
      const cell = state[r]?.[c]
      if (!cell) {
        r += dr
        c += dc
        continue
      }
      if (cell.color === byColor && (cell.type === 'r' || cell.type === 'q')) return true
      break
    }
  }

  const diagonals: Array<[number, number]> = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]
  for (const [dr, dc] of diagonals) {
    let r = row + dr
    let c = col + dc
    while (isInside(r, c)) {
      const cell = state[r]?.[c]
      if (!cell) {
        r += dr
        c += dc
        continue
      }
      if (cell.color === byColor && (cell.type === 'b' || cell.type === 'q')) return true
      break
    }
  }

  return false
}

const isKingInCheck = (state: Board, color: Color) => {
  const kingPos = findKing(state, color)
  if (!kingPos) return false
  const opponent = color === 'white' ? 'black' : 'white'
  return isSquareAttacked(state, kingPos.row, kingPos.col, opponent)
}

const applyMoveOnBoard = (state: Board, move: Move) => {
  const clone = cloneBoard(state)
  const piece = clone[move.from.row]?.[move.from.col]
  if (!piece) return clone
  clone[move.to.row][move.to.col] = piece
  clone[move.from.row][move.from.col] = null
  if (
    piece.type === 'p' &&
    ((piece.color === 'white' && move.to.row === 0) || (piece.color === 'black' && move.to.row === 7))
  ) {
    clone[move.to.row][move.to.col] = { ...piece, type: 'q' }
  }
  return clone
}

const generatePseudoMoves = (state: Board, row: number, col: number, piece: Piece) => {
  const moves: Array<[number, number]> = []
  const pushLine = (dr: number, dc: number) => {
    let r = row + dr
    let c = col + dc
    while (isInside(r, c)) {
      const target = state[r]?.[c]
      if (!target) {
        moves.push([r, c])
      } else {
        if (target.color !== piece.color) moves.push([r, c])
        break
      }
      r += dr
      c += dc
    }
  }

  switch (piece.type) {
    case 'p': {
      const dir = piece.color === 'white' ? -1 : 1
      const startRow = piece.color === 'white' ? 6 : 1
      const oneAhead = { r: row + dir, c: col }
      if (isInside(oneAhead.r, oneAhead.c) && !state[oneAhead.r]?.[oneAhead.c]) moves.push([oneAhead.r, oneAhead.c])
      const twoAhead = { r: row + 2 * dir, c: col }
      if (row === startRow && !state[oneAhead.r]?.[oneAhead.c] && !state[twoAhead.r]?.[twoAhead.c]) {
        moves.push([twoAhead.r, twoAhead.c])
      }
      const captures = [
        [row + dir, col - 1],
        [row + dir, col + 1],
      ]
      for (const [r, c] of captures) {
        if (!isInside(r, c)) continue
        const target = state[r]?.[c]
        if (target && target.color !== piece.color) moves.push([r, c])
      }
      break
    }
    case 'r':
      pushLine(1, 0)
      pushLine(-1, 0)
      pushLine(0, 1)
      pushLine(0, -1)
      break
    case 'b':
      pushLine(1, 1)
      pushLine(1, -1)
      pushLine(-1, 1)
      pushLine(-1, -1)
      break
    case 'q':
      pushLine(1, 0)
      pushLine(-1, 0)
      pushLine(0, 1)
      pushLine(0, -1)
      pushLine(1, 1)
      pushLine(1, -1)
      pushLine(-1, 1)
      pushLine(-1, -1)
      break
    case 'n': {
      const jumps: Array<[number, number]> = [
        [2, 1],
        [2, -1],
        [-2, 1],
        [-2, -1],
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2],
      ]
      for (const [dr, dc] of jumps) {
        const r = row + dr
        const c = col + dc
        if (!isInside(r, c)) continue
        const target = state[r]?.[c]
        if (!target || target.color !== piece.color) moves.push([r, c])
      }
      break
    }
    case 'k': {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const r = row + dr
          const c = col + dc
          if (!isInside(r, c)) continue
          const target = state[r]?.[c]
          if (!target || target.color !== piece.color) moves.push([r, c])
        }
      }
      break
    }
  }
  return moves
}

const legalMovesForPosition = (state: Board, row: number, col: number, piece: Piece) => {
  const pseudo = generatePseudoMoves(state, row, col, piece)
  const safe: string[] = []
  for (const [r, c] of pseudo) {
    const nextBoard = applyMoveOnBoard(state, { from: { row, col }, to: { row: r, col: c } })
    if (!isKingInCheck(nextBoard, piece.color)) safe.push(positionToSquare(r, c))
  }
  return safe
}

const collectAllLegalMoves = (state: Board, color: Color): Move[] => {
  const result: Move[] = []
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = state[r]?.[c]
      if (!piece || piece.color !== color) continue
      const pseudo = generatePseudoMoves(state, r, c, piece)
      for (const [nr, nc] of pseudo) {
        const nextBoard = applyMoveOnBoard(state, { from: { row: r, col: c }, to: { row: nr, col: nc } })
        if (!isKingInCheck(nextBoard, color)) result.push({ from: { row: r, col: c }, to: { row: nr, col: nc } })
      }
    }
  }
  return result
}

const renderPiece = (color: Color, type: Piece['type']) => {
  const glyphsBlack: Record<Piece['type'], string> = {
    p: '\u265f',
    r: '\u265c',
    n: '\u265e',
    b: '\u265d',
    q: '\u265b',
    k: '\u265a',
  }
  const glyphsWhite: Record<Piece['type'], string> = {
    p: '\u2659',
    r: '\u2656',
    n: '\u2658',
    b: '\u2657',
    q: '\u2655',
    k: '\u2654',
  }
  return color === 'white' ? glyphsWhite[type] : glyphsBlack[type]
}

const squareClass = (rowIndex: number, fileIndex: number, file: string, rank: number) => {
  const dark = (rowIndex + fileIndex) % 2 === 1 ? 'obscur' : 'clair'
  const square = `${file}${rank}`
  const isSelected =
    selected.value && selected.value.row === rowIndex && selected.value.col === fileIndex
  return {
    [dark]: true,
    selected: isSelected,
    playable: legalMoves.value.includes(square),
    disabled: isGameOver.value || isBotTurn.value,
  }
}

const evaluateBoard = (state: Board, perspective: Color) => {
  const values: Record<Piece['type'], number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 }
  let score = 0
  for (const row of state) {
    for (const cell of row) {
      if (!cell) continue
      const value = values[cell.type]
      score += cell.color === perspective ? value : -value
    }
  }
  return score
}

const chooseBotMove = (state: Board, color: Color, level: string) => {
  const moves = collectAllLegalMoves(state, color)
  if (!moves.length) return null
  if (level === 'easy') return moves[Math.floor(Math.random() * moves.length)]
  if (level === 'normal') {
    const captures = moves.filter((m) => state[m.to.row]?.[m.to.col])
    return (captures[0] || moves[Math.floor(Math.random() * moves.length)]) ?? moves[0]
  }

  const depth = 2
  let bestScore = -Infinity
  let bestMove: Move | null = null
  const opponent = color === 'white' ? 'black' : 'white'

  const minimax = (boardState: Board, ply: number, maximizing: boolean): number => {
    const currentColor = maximizing ? color : opponent
    const legal = collectAllLegalMoves(boardState, currentColor)
    if (ply === 0 || !legal.length) return evaluateBoard(boardState, color)
    if (maximizing) {
      let maxEval = -Infinity
      for (const mv of legal) {
        const evalBoard = applyMoveOnBoard(boardState, mv)
        const evalScore = minimax(evalBoard, ply - 1, false)
        maxEval = Math.max(maxEval, evalScore)
      }
      return maxEval
    } else {
      let minEval = Infinity
      for (const mv of legal) {
        const evalBoard = applyMoveOnBoard(boardState, mv)
        const evalScore = minimax(evalBoard, ply - 1, true)
        minEval = Math.min(minEval, evalScore)
      }
      return minEval
    }
  }

  for (const mv of moves) {
    const scored = minimax(applyMoveOnBoard(state, mv), depth - 1, false)
    if (scored > bestScore) {
      bestScore = scored
      bestMove = mv
    }
  }
  return bestMove ?? moves[0]
}

const finishGame = (winner: Color | 'draw', reason: 'checkmate' | 'resign' | 'draw') => {
  if (!currentMatch.value) return
  matchesStore.finishMatch(matchId, { winner, reason })
  statusNote.value = winner === 'draw' ? 'Match nul' : winner === 'white' ? 'Victoire des blancs' : 'Victoire des noirs'
  setTimeout(() => {
    const destination = userStore.isAuthenticated ? { name: 'match-list' } : { name: 'login' }
    router.push(destination)
  }, 1200)
}

const evaluateGameState = () => {
  const currentColor = turn.value
  const moves = collectAllLegalMoves(board.value, currentColor)
  const inCheck = isKingInCheck(board.value, currentColor)

  if (!moves.length) {
    if (inCheck) {
      const winner = currentColor === 'white' ? 'black' : 'white'
      finishGame(winner, 'checkmate')
    } else {
      finishGame('draw', 'draw')
    }
    return
  }

  statusNote.value = inCheck ? `Echec aux ${currentColor === 'white' ? 'blancs' : 'noirs'}` : ''

  if (isBotTurn.value) {
    isBotThinking.value = true
    setTimeout(() => {
      const move = chooseBotMove(
        board.value,
        botColor.value as Color,
        currentMatch.value?.botLevel ?? 'normal',
      )
      if (move) {
        performMove(move)
      }
      isBotThinking.value = false
    }, 260)
  }
}

const performMove = (move: Move) => {
  if (!currentMatch.value) return
  const piece = board.value[move.from.row]?.[move.from.col]
  if (!piece) return
  const newBoard = applyMoveOnBoard(board.value, move)
  board.value = newBoard
  turn.value = turn.value === 'white' ? 'black' : 'white'
  matchesStore.updateBoard(matchId, newBoard, turn.value)
  selected.value = null
  legalMoves.value = []
  evaluateGameState()
}

const selectSquare = (row: number, col: number) => {
  if (isGameOver.value || isBotTurn.value) return
  const piece = board.value[row]?.[col]

  if (!selected.value) {
    if (!piece || piece.color !== turn.value) return
    selected.value = { row, col }
    legalMoves.value = legalMovesForPosition(board.value, row, col, piece)
    return
  }

  const square = positionToSquare(row, col)
  const isPlayable = legalMoves.value.includes(square)
  if (selected.value.row === row && selected.value.col === col) {
    selected.value = null
    legalMoves.value = []
    return
  }

  if (isPlayable) {
    performMove({ from: { row: selected.value.row, col: selected.value.col }, to: { row, col } })
    return
  }

  if (piece && piece.color === turn.value) {
    selected.value = { row, col }
    legalMoves.value = legalMovesForPosition(board.value, row, col, piece)
  }
}

const resetGame = () => {
  if (!currentMatch.value) return
  const reset = matchesStore.resetMatch(currentMatch.value.id)
  if (reset) {
    syncFromStore()
    selected.value = null
    legalMoves.value = []
    evaluateGameState()
  }
}

const resign = () => {
  if (isGameOver.value || !currentMatch.value) return
  const winner = turn.value === 'white' ? 'black' : 'white'
  finishGame(winner, 'resign')
}

const declareDraw = () => {
  if (isGameOver.value) return
  finishGame('draw', 'draw')
}

const backToList = () => {
  router.push({ name: userStore.isAuthenticated ? 'match-list' : 'login' })
}

onMounted(() => {
  if (!currentMatch.value) return
  syncFromStore()
  evaluateGameState()
})
</script>

<style scoped>
.game-layout {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.board-panel {
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.players {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.player {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  padding: 12px;
  border-radius: 12px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.board-actions {
  margin: 4px 0 4px;
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.board-actions .danger {
  border-color: rgba(255, 107, 107, 0.5);
  color: #ff9b9b;
}

.status {
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text-main);
  text-align: center;
}

.ai-label {
  text-align: center;
}

.board-shell {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.board-shell__header {
  width: 100%;
}

.board-wrap {
  display: flex;
  justify-content: center;
  width: 100%;
}

#plateau {
  --board-size: min(96vw, 540px);
  --edge: clamp(12px, calc(var(--board-size) * 0.05), 22px);
  --case: calc((var(--board-size) - 2 * var(--edge)) / 8);
  display: grid;
  grid-template-columns: var(--edge) repeat(8, var(--case)) var(--edge);
  grid-template-rows: var(--edge) repeat(8, var(--case)) var(--edge);
  width: var(--board-size);
  height: var(--board-size);
  background: linear-gradient(145deg, rgba(16, 34, 78, 0.75), rgba(12, 22, 45, 0.95));
  border: 1px solid var(--border-strong);
  border-radius: 22px;
  overflow: hidden;
  box-shadow:
    0 14px 34px rgba(0, 0, 0, 0.35),
    0 0 18px rgba(62, 205, 210, 0.24);
}

.case {
  width: var(--case);
  height: var(--case);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: clamp(1.6rem, calc(var(--case) * 0.75), 2.1rem);
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.03);
  transition:
    transform 0.08s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
  color: #fdf4ff;
}

.case:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.08);
}

.piece[data-piece-color='black'] {
  color: #b3b9c5;
  text-shadow: 0 0 6px rgba(0, 0, 0, 0.45);
}

.piece[data-piece-color='black'][data-piece-type='p'] {
  color: #b2b8c2;
  text-shadow: 0 0 6px rgba(0, 0, 0, 0.45);
}

.case.disabled {
  pointer-events: none;
  opacity: 0.7;
}

.clair {
  background: rgba(46, 209, 197, 0.12);
}

.obscur {
  background: rgba(6, 12, 28, 0.7);
}

.selected {
  box-shadow:
    inset 0 0 0 3px var(--accent),
    0 0 18px rgba(46, 209, 197, 0.28);
  background: linear-gradient(145deg, rgba(46, 209, 197, 0.18), rgba(16, 34, 78, 0.8));
}

.playable {
  outline: 2px dashed var(--accent);
  background: radial-gradient(circle at center, rgba(46, 209, 197, 0.2) 0%, transparent 65%);
}

.noir {
  background: transparent;
  color: var(--text-muted);
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-weight: 700;
  letter-spacing: 0.5px;
}

.side {
  width: var(--edge);
  height: var(--case);
  font-size: clamp(10px, calc(var(--edge) * 0.6), 12px);
}

.top,
.bottom {
  width: var(--case);
  height: var(--edge);
  font-size: clamp(10px, calc(var(--edge) * 0.6), 12px);
}

.corner {
  width: var(--edge);
  height: var(--edge);
}

@media (max-width: 640px) {
  .board-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

<template>
  <main class="container game-layout" v-if="currentMatch">
    <h1>Partie locale</h1>

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
      <div class="board-actions">
        <button class="btn" type="button" @click="resetGame">Reinitialiser</button>
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
              <span v-if="square">{{ renderPiece(square.color, square.type) }}</span>
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

type Color = 'white' | 'black'

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
const ranks = [8, 7, 6, 5, 4, 3, 2, 1]

const route = useRoute()
const router = useRouter()
const matchesStore = useMatchesStore()
const matchId = route.params.id as string

const board = ref<Board>([])
const turn = ref<Color>('white')
const selected = ref<{ row: number; col: number } | null>(null)
const legalMoves = ref<string[]>([])

const currentMatch = computed(() => matchesStore.getMatch(matchId))

const whitePlayer = computed(() => {
  if (!currentMatch.value) return 'Blanc'
  return currentMatch.value.color === 'White'
    ? currentMatch.value.host
    : (currentMatch.value.opponent ?? 'Invite')
})

const blackPlayer = computed(() => {
  if (!currentMatch.value) return 'Noir'
  return currentMatch.value.color === 'Black'
    ? currentMatch.value.host
    : (currentMatch.value.opponent ?? 'Invite')
})

const statusMessage = computed(() => {
  return turn.value === 'white' ? 'Au tour des blancs' : 'Au tour des noirs'
})

const cloneBoard = (source: Board): Board =>
  source.map((row) => row.map((cell) => (cell ? { ...cell } : null)))

const syncFromStore = () => {
  if (!currentMatch.value) return
  board.value = cloneBoard(currentMatch.value.board)
  turn.value = currentMatch.value.turn
}

const positionToSquare = (row: number, col: number) => {
  const file = files[col]
  const rank = ranks[row]
  if (file === undefined || rank === undefined) return ''
  return `${file}${rank}`
}

const selectSquare = (row: number, col: number) => {
  const piece = board.value[row]?.[col]

  if (!selected.value) {
    if (!piece || piece.color !== turn.value) return
    selected.value = { row, col }
    legalMoves.value = computeLegalMoves(row, col, piece)
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
    movePiece(selected.value.row, selected.value.col, row, col)
    selected.value = null
    legalMoves.value = []
    return
  }

  if (piece && piece.color === turn.value) {
    selected.value = { row, col }
    legalMoves.value = computeLegalMoves(row, col, piece)
  }
}

const movePiece = (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
  const piece = board.value[fromRow]?.[fromCol]
  if (!piece) return
  const newBoard = cloneBoard(board.value)
  if (!newBoard[toRow] || !newBoard[fromRow]) return
  newBoard[toRow][toCol] = piece
  newBoard[fromRow][fromCol] = null

  if (piece.type === 'p') {
    if ((piece.color === 'white' && toRow === 0) || (piece.color === 'black' && toRow === 7)) {
      newBoard[toRow][toCol] = { ...piece, type: 'q' }
    }
  }

  board.value = newBoard
  turn.value = turn.value === 'white' ? 'black' : 'white'
  matchesStore.updateBoard(matchId, newBoard, turn.value)
}

const computeLegalMoves = (row: number, col: number, piece: Piece) => {
  const moves: string[] = []
  const direction = piece.color === 'white' ? -1 : 1

  const isInside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8
  const pushIfEmpty = (r: number, c: number) => {
    if (!isInside(r, c)) return false
    if (!board.value[r]) return false
    if (board.value[r][c] === null) {
      moves.push(positionToSquare(r, c))
      return true
    }
    return false
  }

  const pushIfCapture = (r: number, c: number) => {
    if (!isInside(r, c) || !board.value[r]) return
    const target = board.value[r][c]
    if (target && target.color !== piece.color) moves.push(positionToSquare(r, c))
  }

  const pushLine = (deltaR: number, deltaC: number) => {
    let r = row + deltaR
    let c = col + deltaC
    while (isInside(r, c)) {
      const rowData = board.value[r]
      if (!rowData) break
      const target = rowData[c]
      if (!target) {
        moves.push(positionToSquare(r, c))
      } else {
        if (target.color !== piece.color) moves.push(positionToSquare(r, c))
        break
      }
      r += deltaR
      c += deltaC
    }
  }

  switch (piece.type) {
    case 'p': {
      if (
        pushIfEmpty(row + direction, col) &&
        ((piece.color === 'white' && row === 6) || (piece.color === 'black' && row === 1))
      ) {
        pushIfEmpty(row + 2 * direction, col)
      }
      pushIfCapture(row + direction, col - 1)
      pushIfCapture(row + direction, col + 1)
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
        const rowData = board.value[r]
        if (!rowData) continue
        const target = rowData[c]
        if (!target || target.color !== piece.color) moves.push(positionToSquare(r, c))
      }
      break
    }
    case 'k': {
      const steps: number[] = [-1, 0, 1]
      for (const dr of steps) {
        for (const dc of steps) {
          if (dr === 0 && dc === 0) continue
          const r = row + dr
          const c = col + dc
          if (!isInside(r, c)) continue
          const rowData = board.value[r]
          if (!rowData) continue
          const target = rowData[c]
          if (!target || target.color !== piece.color) moves.push(positionToSquare(r, c))
        }
      }
      break
    }
  }

  return moves
}

const renderPiece = (color: Color, type: Piece['type']) => {
  const glyphs: Record<Piece['type'], string> = {
    p: '\u265f',
    r: '\u265c',
    n: '\u265e',
    b: '\u265d',
    q: '\u265b',
    k: '\u265a',
  }
  const glyph = glyphs[type]
  return color === 'white' ? glyph.toUpperCase() : glyph
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
  }
}

const resetGame = () => {
  if (!currentMatch.value) return
  const reset = matchesStore.resetMatch(currentMatch.value.id)
  if (reset) {
    syncFromStore()
    selected.value = null
    legalMoves.value = []
  }
}

const backToList = () => {
  router.push({ name: 'match-list' })
}

onMounted(() => {
  if (!currentMatch.value) return
  syncFromStore()
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

.status {
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text-main);
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
  background: linear-gradient(155deg, rgba(12, 16, 25, 0.85), rgba(9, 12, 20, 0.95));
  border: 1px solid var(--border-strong);
  border-radius: 18px;
  overflow: hidden;
  box-shadow:
    var(--shadow-strong),
    0 0 18px rgba(255, 45, 85, 0.18);
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
  color: #f7f3ed;
}

.case:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.08);
}

.clair {
  background: #0f1725;
}

.obscur {
  background: #0a0f18;
}

.selected {
  box-shadow:
    inset 0 0 0 3px var(--accent),
    0 0 18px rgba(255, 45, 85, 0.35);
  background: linear-gradient(145deg, rgba(255, 45, 85, 0.25), rgba(15, 18, 28, 0.9));
}

.playable {
  outline: 2px dashed var(--accent);
  background: radial-gradient(circle at center, rgba(255, 45, 85, 0.18) 0%, transparent 65%);
}

.noir {
  background: #090e16;
  color: var(--text-muted);
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.04);
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

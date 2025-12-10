<template>
  <main class="container" v-if="currentMatch">
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
      <p class="helper">
       
      </p>
      <div class="board-actions">
        <button class="btn" type="button" @click="resetGame">Réinitialiser</button>
        <button class="btn-outline" type="button" @click="backToList">Retour à la liste</button>
      </div>
      <p class="status">{{ statusMessage }}</p>
    </section>

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
  </main>
  <main v-else class="container">
    <h1>Partie introuvable</h1>
    <p>La partie demandée n'existe plus. Retourne à la liste.</p>
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
    : (currentMatch.value.opponent ?? 'Invité')
})

const blackPlayer = computed(() => {
  if (!currentMatch.value) return 'Noir'
  return currentMatch.value.color === 'Black'
    ? currentMatch.value.host
    : (currentMatch.value.opponent ?? 'Invité')
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
    p: '♟',
    r: '♜',
    n: '♞',
    b: '♝',
    q: '♛',
    k: '♚',
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
.board-panel {
  margin-bottom: 20px;
}

.players {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
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
  margin: 12px 0 16px;
  display: flex;
  gap: 12px;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.status {
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text-main);
}

.board-wrap {
  display: grid;
  place-items: center;
  margin-top: 10px;
}

#plateau {
  display: flex;
  width: 420px;
  flex-flow: row wrap;
  background: linear-gradient(155deg, rgba(12, 16, 25, 0.85), rgba(9, 12, 20, 0.95));
  border: 1px solid var(--border-strong);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: var(--shadow-strong), 0 0 18px rgba(255, 45, 85, 0.18);
}

.case {
  width: 48px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 190%;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.03);
  transition: transform 0.08s ease, box-shadow 0.2s ease, background 0.2s ease;
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
  box-shadow: inset 0 0 0 3px var(--accent), 0 0 18px rgba(255, 45, 85, 0.35);
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
  width: 18px;
  height: 48px;
  font-size: 11px;
}

.top,
.bottom {
  width: 48px;
  height: 18px;
  font-size: 11px;
}

.corner {
  width: 18px;
  height: 18px;
}
</style>

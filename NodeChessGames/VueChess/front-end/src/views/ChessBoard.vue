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
      <p class="helper">Sélectionne une pièce puis sa destination. Les règles de déplacement de base sont validées.</p>
      <div class="board-actions">
        <button class="btn" type="button" @click="resetGame">Réinitialiser</button>
        <button class="btn-outline" type="button" @click="backToList">Retour à la liste</button>
      </div>
      <p class="status">{{ statusMessage }}</p>
    </section>

    <div class="board-wrap">
      <div id="plateau">
        <div class="noir corner"></div>
        <div v-for="file in files" :key="`top-${file}`" class="noir top">{{ file.toUpperCase() }}</div>
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
        <div v-for="file in files" :key="`bottom-${file}`" class="noir bottom">{{ file.toUpperCase() }}</div>
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
  return currentMatch.value.color === 'White' ? currentMatch.value.host : currentMatch.value.opponent ?? 'Invité'
})

const blackPlayer = computed(() => {
  if (!currentMatch.value) return 'Noir'
  return currentMatch.value.color === 'Black' ? currentMatch.value.host : currentMatch.value.opponent ?? 'Invité'
})

const statusMessage = computed(() => {
  return turn.value === 'white' ? 'Au tour des blancs' : 'Au tour des noirs'
})

const cloneBoard = (source: Board): Board => source.map((row) => row.map((cell) => (cell ? { ...cell } : null)))

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
      if (pushIfEmpty(row + direction, col) && ((piece.color === 'white' && row === 6) || (piece.color === 'black' && row === 1))) {
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
  const isSelected = selected.value && selected.value.row === rowIndex && selected.value.col === fileIndex
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
  margin-bottom: 16px;
}

.players {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.player {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  padding: 10px;
  border-radius: 8px;
}

.board-actions {
  margin: 10px 0 14px;
  display: flex;
  gap: 12px;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.status {
  font-weight: 600;
}

.board-wrap {
  display: grid;
  place-items: center;
}

#plateau {
  display: flex;
  width: 380px;
  flex-flow: row wrap;
}

.case {
  width: 45px;
  height: 45px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 190%;
  cursor: pointer;
  border: none;
}

.case:hover {
  opacity: 0.9;
}

.clair {
  background: #adb5bd;
  color: #000;
}

.obscur {
  background: #495057;
  color: #fff;
}

.selected {
  box-shadow: inset 0 0 0 3px var(--accent);
}

.playable {
  outline: 2px dashed #0b5ed7;
}

.noir {
  background: #000;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
}

.side {
  width: 10px;
  height: 45px;
  font-size: 10px;
}

.top,
.bottom {
  width: 45px;
  height: 10px;
  font-size: 10px;
}

.corner {
  width: 10px;
  height: 10px;
}
</style>

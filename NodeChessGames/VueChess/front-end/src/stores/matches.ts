import { defineStore } from 'pinia'

type Color = 'white' | 'black'
export type MatchColor = 'White' | 'Black'
export type MatchStatus = 'waiting' | 'playing' | 'finished'

type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k'
export type Board = (Piece | null)[][]
export interface Piece {
  color: Color
  type: PieceType
}

export interface Match {
  id: string
  host: string
  color: MatchColor
  opponent?: string
  status: MatchStatus
  board: Board
  turn: Color
}

const createInitialBoard = (): Board => {
  const emptyRow: (Piece | null)[] = Array(8).fill(null)
  const board: Board = []

  board.push([
    { type: 'r', color: 'black' },
    { type: 'n', color: 'black' },
    { type: 'b', color: 'black' },
    { type: 'q', color: 'black' },
    { type: 'k', color: 'black' },
    { type: 'b', color: 'black' },
    { type: 'n', color: 'black' },
    { type: 'r', color: 'black' },
  ])
  board.push(Array(8).fill({ type: 'p', color: 'black' }))
  board.push([...emptyRow])
  board.push([...emptyRow])
  board.push([...emptyRow])
  board.push([...emptyRow])
  board.push(Array(8).fill({ type: 'p', color: 'white' }))
  board.push([
    { type: 'r', color: 'white' },
    { type: 'n', color: 'white' },
    { type: 'b', color: 'white' },
    { type: 'q', color: 'white' },
    { type: 'k', color: 'white' },
    { type: 'b', color: 'white' },
    { type: 'n', color: 'white' },
    { type: 'r', color: 'white' },
  ])

  return board
}

const cloneBoard = (board: Board): Board => board.map((row) => row.map((cell) => (cell ? { ...cell } : null)))

const seedMatches: Match[] = [
  { id: 'michael', host: 'Michael', color: 'White', status: 'waiting', board: createInitialBoard(), turn: 'white' },
  { id: 'spoutnik', host: 'Spoutnik', color: 'White', status: 'waiting', board: createInitialBoard(), turn: 'white' },
  { id: 'thanos', host: 'Thanos', color: 'Black', status: 'waiting', board: createInitialBoard(), turn: 'white' },
  { id: 'mario', host: 'Mario', color: 'Black', status: 'waiting', board: createInitialBoard(), turn: 'white' },
  { id: 'mickey', host: 'Mickey', color: 'Black', status: 'waiting', board: createInitialBoard(), turn: 'white' },
  { id: 'annonyme', host: 'Annonyme', color: 'White', status: 'waiting', board: createInitialBoard(), turn: 'white' },
]

export const useMatchesStore = defineStore('matches', {
  state: () => ({
    matches: seedMatches.map((m) => ({ ...m, board: cloneBoard(m.board) })),
  }),
  getters: {
    sortedMatches(state) {
      return [...state.matches].sort((a, b) => a.host.localeCompare(b.host))
    },
  },
  actions: {
    getMatch(id: string) {
      return this.matches.find((m) => m.id === id)
    },
    createMatch(host: string, color: MatchColor) {
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
      const newMatch: Match = {
        id,
        host,
        color,
        status: 'waiting',
        board: createInitialBoard(),
        turn: 'white',
      }
      this.matches = [newMatch, ...this.matches]
      return newMatch
    },
    joinMatch(id: string, opponentName: string) {
      const match = this.getMatch(id)
      if (!match) return null
      match.opponent = opponentName
      match.status = 'playing'
      return match
    },
    updateBoard(id: string, board: Board, turn: Color) {
      const match = this.getMatch(id)
      if (!match) return
      match.board = cloneBoard(board)
      match.turn = turn
    },
    resetMatch(id: string) {
      const match = this.getMatch(id)
      if (!match) return null
      match.board = createInitialBoard()
      match.turn = 'white'
      match.status = 'playing'
      return match
    },
  },
})

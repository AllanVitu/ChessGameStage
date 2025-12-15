import { defineStore } from 'pinia'

type Color = 'white' | 'black'
export type MatchColor = 'White' | 'Black'
export type MatchStatus = 'waiting' | 'playing' | 'finished'
export type MatchMode = 'local' | 'bot'
export type BotLevel = 'easy' | 'normal' | 'hard'
export type GameResult = { winner: Color | 'draw'; reason: 'checkmate' | 'resign' | 'draw' }

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
  mode: MatchMode
  botLevel?: BotLevel
  result?: GameResult
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
  {
    id: 'michael',
    host: 'Michael',
    color: 'White',
    status: 'waiting',
    board: createInitialBoard(),
    turn: 'white',
    mode: 'local',
  },
  {
    id: 'spoutnik',
    host: 'Spoutnik',
    color: 'White',
    status: 'waiting',
    board: createInitialBoard(),
    turn: 'white',
    mode: 'local',
  },
  {
    id: 'thanos',
    host: 'Thanos',
    color: 'Black',
    status: 'waiting',
    board: createInitialBoard(),
    turn: 'white',
    mode: 'local',
  },
  {
    id: 'mario',
    host: 'Mario',
    color: 'Black',
    status: 'waiting',
    board: createInitialBoard(),
    turn: 'white',
    mode: 'local',
  },
  {
    id: 'mickey',
    host: 'Mickey',
    color: 'Black',
    status: 'waiting',
    board: createInitialBoard(),
    turn: 'white',
    mode: 'local',
  },
  {
    id: 'annonyme',
    host: 'Annonyme',
    color: 'White',
    status: 'waiting',
    board: createInitialBoard(),
    turn: 'white',
    mode: 'local',
  },
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
    createMatch(host: string, color: MatchColor, options?: { mode?: MatchMode; botLevel?: BotLevel }) {
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
      const newMatch: Match = {
        id,
        host,
        color,
        status: options?.mode === 'bot' ? 'playing' : 'waiting',
        board: createInitialBoard(),
        turn: 'white',
        mode: options?.mode ?? 'local',
        botLevel: options?.botLevel,
        opponent: options?.mode === 'bot' ? `IA (${options?.botLevel ?? 'normal'})` : undefined,
      }
      this.matches = [newMatch, ...this.matches]
      return newMatch
    },
    joinMatch(id: string, opponentName: string) {
      const match = this.getMatch(id)
      if (!match) return null
      match.opponent = opponentName
      match.status = 'playing'
      match.result = undefined
      return match
    },
    updateBoard(id: string, board: Board, turn: Color) {
      const match = this.getMatch(id)
      if (!match) return
      match.board = cloneBoard(board)
      match.turn = turn
      match.result = undefined
    },
    resetMatch(id: string) {
      const match = this.getMatch(id)
      if (!match) return null
      match.board = createInitialBoard()
      match.turn = 'white'
      match.status = 'playing'
      match.result = undefined
      return match
    },
    finishMatch(id: string, result: GameResult) {
      const match = this.getMatch(id)
      if (!match) return null
      match.result = result
      match.status = 'finished'
      return match
    },
  },
})

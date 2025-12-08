<template>
  <div class="board-container">
    <div class="board-wrap">
      <div id="plateau">
        <div class="noir corner"></div>
        <div v-for="col in columns" :key="'top-' + col" class="noir top">{{ col }}</div>
        <div class="noir corner"></div>

        <template v-for="(row, rowIndex) in rows" :key="'row-' + row">
          <div class="noir side">{{ row }}</div>

          <div
            v-for="(col, colIndex) in columns"
            :key="col + row"
            class="case"
            :class="isDarkSquare(rowIndex, colIndex) ? 'obscur' : 'clair'"
            @click="handleSquareClick(col, row)"
          >
            <span v-if="getPieceAt(col, row)">{{ getPieceAt(col, row) }}</span>
          </div>

          <div class="noir side">{{ row }}</div>
        </template>

        <div class="noir corner"></div>
        <div v-for="col in columns" :key="'bot-' + col" class="noir bottom">{{ col }}</div>
        <div class="noir corner"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const rows = [8, 7, 6, 5, 4, 3, 2, 1] // Ordre d'affichage des échecs

// Exemple de position initiale simplifiée (mapping colonne/ligne -> unicode)
const pieces = {
  A8: '♜',
  B8: '♞',
  C8: '♝',
  D8: '♛',
  E8: '♚', // ... compléter
  A1: '♖',
  B1: '♘', // ...
}

const isDarkSquare = (rIndex: number, cIndex: number) => {
  // Si la somme des index est impaire, c'est une case foncée (ou inversement selon ta logique CSS)
  return (rIndex + cIndex) % 2 === 1
}

const getPieceAt = (col: string, row: number) => {
  return pieces[`${col}${row}` as keyof typeof pieces] || ''
}

const handleSquareClick = (col: string, row: number) => {
  console.log(`Case cliquée : ${col}${row}`)
}
</script>

<style scoped>
/* Importe ici le CSS spécifique au plateau depuis ton game.html */
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
}
.clair {
  background: #adb5bd;
  color: #000;
}
.obscur {
  background: #495057;
  color: #fff;
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

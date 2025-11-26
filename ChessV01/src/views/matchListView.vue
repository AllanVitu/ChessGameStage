<template>
  <main class="container">
    <h1>Match List</h1>

    <div class="btn-outline-top">
      <router-link class="btn-nav" to="/new-match">Create new match</router-link>
      <router-link class="btn-nav" to="/profile">Profil</router-link>
    </div>

    <div style="margin-top: 20px; overflow-y: auto; padding-right: 5px;">
      <article class="match-row" v-for="(match, index) in matches" :key="index">
        <div class="cell pseudo">{{ match.pseudo }}</div>
        <div :class="['cell', match.color === 'White' ? 'text-white' : 'text-black']">
          {{ match.color }}
        </div>
        <div class="join">
          <router-link to="/game">Join</router-link>
        </div>
      </article>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Données simulées (plus tard, elles viendront d'une API/Base de données)
const matches = ref([
  { pseudo: 'Michael', color: 'White' },
  { pseudo: 'Spoutnik', color: 'White' },
  { pseudo: 'Thanos', color: 'Black' },
  { pseudo: 'Mario', color: 'Black' },
  { pseudo: 'Mickey', color: 'Black' },
  { pseudo: 'Annonyme', color: 'White' },
]);
</script>

<style scoped>
/* Styles spécifiques à cette page (boutons nav, lignes...) */
.btn-outline-top { display: flex; justify-content: center; gap: 15px; margin-bottom: 25px; }
.btn-nav { background: transparent; border: 1px solid var(--border); color: var(--text-muted); padding: 8px 16px; border-radius: 20px; font-size: 0.9rem; transition: all 0.2s; display: flex; align-items: center; }
.btn-nav:hover, .router-link-active { background: rgba(255, 255, 255, 0.1); color: var(--text-main); border-color: var(--text-main); }
.match-row { display: grid; grid-template-columns: 1.2fr 1fr 0.8fr; background-color: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 12px; overflow: hidden; align-items: center; }
.cell { padding: 15px 10px; font-size: 0.95rem; display: flex; align-items: center; }
.pseudo { font-weight: 600; padding-left: 15px; color: var(--text-main); }
.text-white { color: #fff; text-shadow: 0 0 5px rgba(255,255,255,0.3); }
.text-black { color: #aaa; font-weight: bold; }
.join { height: 100%; display: flex; }
.join a { background-color: var(--accent); color: white; width: 100%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.9rem; transition: background 0.2s; text-transform: uppercase; letter-spacing: 0.5px; }
.join a:hover { background-color: #0b5ed7; }
</style>
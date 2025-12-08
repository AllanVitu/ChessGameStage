<template>
  <main class="container">
    <h1>Match List</h1>

    <section class="card">
      <p class="section-title">Créer une partie locale</p>
      <div class="grid2">
        <input v-model="hostName" class="input" placeholder="Ton pseudo" />
        <input v-model="opponentName" class="input" placeholder="Pseudo de l'adversaire" />
        <select v-model="hostColor" class="input">
          <option value="White">Je commence (Blanc)</option>
          <option value="Black">Je laisse commencer (Noir)</option>
        </select>
        <button class="btn" type="button" @click="createLocalMatch">Lancer la partie</button>
      </div>
      <p class="helper">
        Les parties sont stockées en mémoire pour jouer en face à face sur le même écran.
      </p>
    </section>

    <div class="btn-outline-top">
      <router-link class="btn-nav" to="/profile">Profil</router-link>
      <router-link class="btn-nav" to="/">Déconnexion</router-link>
    </div>

    <section style="margin-top: 20px; overflow-y: auto; padding-right: 5px">
      <article v-for="match in matches" :key="match.id" class="match-row">
        <div class="cell pseudo">{{ match.host }}</div>
        <div class="cell" :class="match.color === 'White' ? 'text-white' : 'text-black'">
          {{ match.color }}
        </div>
        <div class="cell opponent" v-if="match.opponent">vs {{ match.opponent }}</div>
        <div class="join">
          <button class="join-btn" type="button" @click="joinAndPlay(match)">
            {{ match.status === 'playing' ? 'Reprendre' : 'Rejoindre' }}
          </button>
        </div>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useMatchesStore, type Match } from '../stores/matches'
import { ref } from 'vue'

const router = useRouter()
const matchesStore = useMatchesStore()

const hostName = ref('')
const opponentName = ref('')
const hostColor = ref<'White' | 'Black'>('White')

const matches = matchesStore.sortedMatches

const createLocalMatch = () => {
  if (!hostName.value.trim()) return
  const created = matchesStore.createMatch(hostName.value.trim(), hostColor.value)
  const opponent = opponentName.value.trim() || 'Invité'
  matchesStore.joinMatch(created.id, opponent)
  router.push({ name: 'game', params: { id: created.id } })
}

const joinAndPlay = (match: Match) => {
  const opponent = match.opponent || prompt("Pseudo de l'adversaire ?", 'Invité') || 'Invité'
  matchesStore.joinMatch(match.id, opponent)
  router.push({ name: 'game', params: { id: match.id } })
}
</script>

<style scoped>
.btn-outline-top {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 25px;
}

.btn-nav {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}

.btn-nav:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-main);
  border-color: var(--text-main);
}

.match-row {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 1.2fr 0.8fr;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
  align-items: center;
}

.cell {
  padding: 15px 10px;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
}

.pseudo {
  font-weight: 600;
  padding-left: 15px;
  color: var(--text-main);
}

.text-white {
  color: #fff;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
}

.text-black {
  color: #000000;
  font-weight: bold;
}

.opponent {
  color: var(--text-muted);
}

.join {
  height: 100%;
  display: flex;
}

.join-btn {
  background-color: var(--accent);
  color: white;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  transition: background 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: none;
  cursor: pointer;
}

.join-btn:hover {
  background-color: #0b5ed7;
}
</style>

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
      <p class="helper"></p>
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
  gap: 16px;
  margin: 6px 0 22px;
  flex-wrap: wrap;
}

.btn-nav {
  background: rgba(255, 45, 85, 0.12);
  border: 1px solid var(--border);
  color: var(--text-main);
  padding: 10px 18px;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.4px;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.25);
}

.btn-nav:hover {
  background: var(--accent-soft);
  color: #ffffff;
  border-color: var(--border-strong);
  box-shadow: var(--glow);
}

.match-row {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 1.2fr 0.8fr;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.03), rgba(14, 18, 27, 0.7));
  border: 1px solid var(--border);
  border-radius: 14px;
  margin-bottom: 14px;
  overflow: hidden;
  align-items: center;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.35);
  transition:
    border 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.15s ease;
}

.match-row:hover {
  border-color: var(--border-strong);
  box-shadow:
    0 18px 32px rgba(0, 0, 0, 0.42),
    0 0 20px rgba(255, 45, 85, 0.2);
  transform: translateY(-2px);
}

.cell {
  padding: 16px 12px;
  font-size: 0.98rem;
  display: flex;
  align-items: center;
}

.pseudo {
  font-weight: 700;
  padding-left: 15px;
  color: var(--text-main);
  letter-spacing: 0.3px;
}

.text-white {
  color: #f7f3ed;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.35);
}

.text-black {
  color: #d7dbe2;
  font-weight: 700;
}

.opponent {
  color: var(--text-muted);
}

.join {
  height: 100%;
  display: flex;
}

.join-btn {
  background: linear-gradient(120deg, var(--accent) 0%, #ff4b3e 60%, var(--accent-2) 100%);
  color: white;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
  transition:
    transform 0.1s ease,
    box-shadow 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: none;
  cursor: pointer;
  border-left: 1px solid var(--border-strong);
  box-shadow: 0 12px 24px rgba(255, 45, 85, 0.25);
}

.join-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(255, 45, 85, 0.3);
}

@media (max-width: 780px) {
  .match-row {
    grid-template-columns: 1fr 1fr;
  }

  .join {
    grid-column: 1 / -1;
  }
}
</style>

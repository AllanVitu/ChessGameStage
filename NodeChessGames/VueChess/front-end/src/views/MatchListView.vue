<template>
  <main class="container match-layout">
    <div class="bg-illustration"></div>

    <header class="topbar">
      <div class="brand">
        <div class="avatar-chip" :data-empty="!hasAccount">
          <img v-if="userAvatar" :src="userAvatar" alt="Avatar" />
          <span v-else>{{ userInitial }}</span>
        </div>
        <div>
          <p class="brand-name">{{ hasAccount ? userPseudo : 'Joueur local' }}</p>
          <p class="brand-sub" v-if="hasAccount">{{ userEmail }}</p>
        </div>
      </div>
      <div class="top-actions">
        <router-link class="chip-btn" to="/profile">Profil</router-link>
        <router-link class="chip-btn danger" to="/">Deconnexion</router-link>
      </div>
    </header>

    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Parties locales en un clic</p>
        <h1>Lance ou rejoins une partie</h1>
        <p class="lede">
          Choisis ta couleur, invite un ami ou reprends une partie existante. L'interface s'inspire d'un
          paysage crepusculaire pour un rendu pro et immersif.
        </p>
        <div class="hero-stats">
          <span class="pill">
            <small>En attente</small>
            <strong>{{ waitingCount }}</strong>
          </span>
          <span class="pill secondary">
            <small>En cours</small>
            <strong>{{ playingCount }}</strong>
          </span>
        </div>
      </div>

      <div class="glass-card creation-card">
        <div class="row" style="justify-content: space-between; align-items: center; gap: 15px">
          <p class="section-title">Creer une partie</p>
          <div class="mode-switch">
            <button
              class="chip-btn"
              :class="{ active: playMode === 'bot' }"
              type="button"
              @click="playMode = 'bot'"
            >
              Jouer contre l'IA
            </button>
            <button
              class="chip-btn"
              :class="{ active: playMode === 'human' }"
              type="button"
              @click="playMode = 'human'"
            >
              Jouer contre un joueur
            </button>
          </div>
        </div>

        <div class="grid2">
          <select v-if="playMode === 'bot'" v-model="botLevel" class="input">
            <option value="easy">IA - Facile</option>
            <option value="normal">IA - Normal</option>
            <option value="hard">IA - Difficile</option>
          </select>
          <input v-model="hostName" class="input" placeholder="Ton pseudo" />
          <input
            v-if="playMode === 'human'"
            v-model="opponentName"
            class="input"
            placeholder="Pseudo de l'adversaire"
          />
          <select v-model="hostColor" class="input">
            <option value="White">Je commence (Blanc)</option>
            <option value="Black">Je laisse commencer (Noir)</option>
          </select>
          <button class="btn" type="button" :disabled="!canCreate" @click="createLocalMatch">Lancer la partie</button>
        </div>
        <p class="helper">
          Le match se cree instantanement et ton adversaire est ajoute automatiquement.
          <span v-if="playMode === 'bot'">En mode IA, elle joue le cote oppose.</span>
        </p>
      </div>
    </section>

    <section class="list-panel">
      <div class="list-head">
        <p class="section-title">Parties disponibles</p>
        <p class="legend">
          Les parties sont triees par hote. Clique sur <span class="legend-pill">Rejoindre</span> pour entrer ou
          reprendre.
        </p>
      </div>

      <div v-if="!matches.length" class="empty-state">
        <p class="title">Aucune partie pour le moment</p>
        <p class="subtitle">Cree ta premiere partie ou attends qu'un hote partage son lien.</p>
      </div>

      <article v-for="match in matches" :key="match.id" class="match-row">
        <div class="match-meta">
          <div class="pseudo">{{ match.host }}</div>
          <div class="tags">
            <span class="badge id">#{{ match.id.slice(0, 6) }}</span>
            <span class="badge" :class="match.color === 'White' ? 'white' : 'black'">{{ match.color }}</span>
            <span class="badge status" :data-status="match.status">
              {{ match.status === 'playing' ? 'En cours' : 'En attente' }}
            </span>
          </div>
        </div>
        <div class="opponent" :class="{ free: !match.opponent }">
          {{ match.opponent ? `vs ${match.opponent}` : 'Adversaire libre' }}
        </div>
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
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMatchesStore, type Match } from '../stores/matches'
import { useUserStore } from '../stores/user'

const router = useRouter()
const matchesStore = useMatchesStore()
const userStore = useUserStore()

const hostName = ref('')
const opponentName = ref('')
const hostColor = ref<'White' | 'Black'>('White')
const playMode = ref<'human' | 'bot'>('human')
const botLevel = ref<'easy' | 'normal' | 'hard'>('normal')

const matches = computed<Match[]>(() => matchesStore.sortedMatches)
const waitingCount = computed(() => matches.value.filter((m) => m.status === 'waiting').length)
const playingCount = computed(() => matches.value.filter((m) => m.status === 'playing').length)
const canCreate = computed(() => !!hostName.value.trim())
const hasAccount = computed(() => Boolean(userStore.user?.id || userStore.user?._id))
const userPseudo = computed(() => userStore.user?.pseudo || userStore.user?.email || 'Player')
const userEmail = computed(() => userStore.user?.email || 'Mode local')
const userAvatar = computed(() => userStore.user?.avatar || '')
const userInitial = computed(() =>
  (userStore.user?.pseudo || userStore.user?.email || 'P').charAt(0).toUpperCase(),
)

const createLocalMatch = () => {
  if (!hostName.value.trim()) return

  const created = matchesStore.createMatch(hostName.value.trim(), hostColor.value, {
    mode: playMode.value === 'bot' ? 'bot' : 'local',
    botLevel: playMode.value === 'bot' ? botLevel.value : undefined,
  })

  if (playMode.value === 'human') {
    const opponent = opponentName.value.trim() || 'Invite'
    matchesStore.joinMatch(created.id, opponent)
  }

  router.push({ name: 'game', params: { id: created.id } })
}

const joinAndPlay = (match: Match) => {
  if (match.mode !== 'bot') {
    const opponent = match.opponent || prompt("Pseudo de l'adversaire ?", 'Invite') || 'Invite'
    matchesStore.joinMatch(match.id, opponent)
  }
  router.push({ name: 'game', params: { id: match.id } })
}
</script>

<style scoped>
.match-layout {
  position: relative;
  overflow: hidden;
  padding: 12px 8px 28px;
}

.bg-illustration {
  position: absolute;
  inset: -60px;
  background:
    radial-gradient(140% 90% at 80% 10%, rgba(255, 138, 101, 0.22), transparent 60%),
    radial-gradient(110% 80% at 20% 5%, rgba(74, 116, 255, 0.24), transparent 60%),
    linear-gradient(145deg, #0a132a 0%, #1a2d4c 48%, #3a4f7c 75%, #f2776b 110%);
  opacity: 0.9;
  filter: blur(2px);
  z-index: 0;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 2;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-chip {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.1);
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.6px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.avatar-chip img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-chip[data-empty='true'] {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.08);
}

.brand-name {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.4px;
}

.brand-sub {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.logo-dot {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.08));
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06), 0 10px 20px rgba(0, 0, 0, 0.28);
  font-size: 1.2rem;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
}

.chip-btn {
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-main);
  font-weight: 600;
  letter-spacing: 0.3px;
  transition: all 0.18s ease;
}

.chip-btn:hover {
  background: rgba(255, 255, 255, 0.16);
  box-shadow: var(--glow);
  transform: translateY(-1px);
}

.chip-btn.danger {
  border-color: rgba(255, 143, 143, 0.35);
  background: rgba(255, 85, 102, 0.12);
}

.chip-btn.active {
  background: rgba(46, 209, 197, 0.18);
  border-color: rgba(46, 209, 197, 0.4);
  box-shadow: 0 0 12px rgba(46, 209, 197, 0.25);
}

.mode-switch {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.hero {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 22px;
  margin: 24px 0 16px;
  position: relative;
  z-index: 2;
}

.hero-copy {
  padding: 20px 16px 10px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 1.8px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 10px;
}

.lede {
  margin: 10px 0 16px;
  color: var(--text-muted);
  max-width: 620px;
  line-height: 1.6;
}

.hero-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.pill {
  min-width: 140px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
}

.pill small {
  display: block;
  color: var(--text-muted);
  letter-spacing: 0.3px;
}

.pill strong {
  font-size: 1.35rem;
  letter-spacing: 1px;
}

.pill.secondary {
  background: rgba(122, 93, 248, 0.12);
  border-color: rgba(122, 93, 248, 0.35);
}

.glass-card {
  background: linear-gradient(175deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.08));
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 20px;
  padding: 18px 18px 12px;
  box-shadow:
    0 18px 36px rgba(0, 0, 0, 0.35),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
}

.creation-card .btn {
  width: 100%;
}

.list-panel {
  margin-top: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  padding: 16px 14px 6px;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 2;
}

.list-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.legend {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.96rem;
}

.legend-pill {
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.empty-state {
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  padding: 18px;
  text-align: center;
  color: var(--text-muted);
}

.empty-state .title {
  margin: 0 0 6px;
  font-weight: 700;
  color: var(--text-main);
}

.empty-state .subtitle {
  margin: 0;
}

.match-row {
  display: grid;
  grid-template-columns: 1.6fr 1.2fr 0.8fr;
  align-items: center;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  margin-bottom: 12px;
  padding: 12px 12px 12px 14px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
  transition:
    transform 0.14s ease,
    box-shadow 0.18s ease,
    border 0.18s ease;
}

.match-row:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.22);
  box-shadow:
    0 16px 32px rgba(0, 0, 0, 0.34),
    0 0 22px rgba(122, 93, 248, 0.24);
}

.match-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pseudo {
  font-weight: 700;
  letter-spacing: 0.4px;
  font-size: 1.05rem;
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  padding: 6px 10px;
  border-radius: 12px;
  font-size: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-main);
  letter-spacing: 0.2px;
}

.badge.id {
  color: rgba(255, 255, 255, 0.85);
  border-style: dashed;
}

.badge.white {
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.2), rgba(46, 209, 197, 0.18));
  border-color: rgba(255, 255, 255, 0.28);
}

.badge.black {
  background: linear-gradient(120deg, rgba(122, 93, 248, 0.2), rgba(24, 36, 68, 0.6));
  border-color: rgba(122, 93, 248, 0.38);
}

.badge.status[data-status='waiting'] {
  background: rgba(255, 209, 126, 0.14);
  border-color: rgba(255, 209, 126, 0.35);
  color: #ffe5b1;
}

.badge.status[data-status='playing'] {
  background: rgba(46, 209, 197, 0.16);
  border-color: rgba(46, 209, 197, 0.4);
  color: #b8fff4;
}

.opponent {
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

.opponent.free {
  color: #ffe5b1;
}

.join {
  display: flex;
  justify-content: flex-end;
}

.join-btn {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: linear-gradient(125deg, #2ed1c5 0%, #3d9bd8 45%, #7a5df8 100%);
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.28),
    0 10px 26px rgba(122, 93, 248, 0.3);
  cursor: pointer;
  transition:
    transform 0.12s ease,
    box-shadow 0.16s ease;
}

.join-btn:hover {
  transform: translateY(-1px);
  box-shadow:
    0 16px 32px rgba(0, 0, 0, 0.32),
    0 12px 28px rgba(122, 93, 248, 0.34);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 960px) {
  .hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .topbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero {
    margin-top: 10px;
  }

  .match-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .join {
    width: 100%;
  }
}
</style>

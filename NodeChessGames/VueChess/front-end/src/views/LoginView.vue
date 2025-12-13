<template>
  <main class="container">
    <h1>WarChess</h1>
    <img src="/logo.png" alt="logo WarChess" class="responsive-logo" />

    <form class="card" @submit.prevent="handleLogin">
      <p class="section-title">Connexion</p>
      <div class="grid2">
        <input v-model="email" class="input" type="email" required placeholder="Email" />
        <input
          v-model="password"
          class="input"
          type="password"
          required
          minlength="6"
          placeholder="Mot de passe"
        />
      </div>

      <p v-if="error" class="feedback error-msg">{{ error }}</p>

      <div class="row" style="margin-top: 14px; justify-content: center; gap: 10px">
        <button class="btn" type="submit" :disabled="loading">
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </button>
        <router-link to="/register" class="btn-outline">Creer un compte</router-link>
      </div>

      <div style="text-align: center; margin-top: 15px">
        <button type="button" class="btn-outline2" @click="continueOffline">
          Mode local (sans API)
        </button>
      </div>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const router = useRouter()
const userStore = useUserStore()

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })

    const data = await response.json()

    if (response.ok) {
      userStore.setToken(data.token)
      userStore.setUser(data.user ?? { email: email.value })
      router.push('/match-list')
    } else {
      error.value = data.error || 'Erreur de connexion'
    }
  } catch (e) {
    error.value = 'Impossible de joindre le serveur. Utilise le mode local pour tester.'
  } finally {
    loading.value = false
  }
}

const continueOffline = () => {
  const pseudo = email.value ? email.value.split('@')[0] : 'Invite'
  userStore.setToken(`local-${Date.now()}`)
  userStore.setUser({ pseudo, email: email.value || 'local@offline' })
  router.push('/match-list')
}
</script>

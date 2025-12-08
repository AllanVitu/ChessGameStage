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

      <p v-if="error" class="error-msg">{{ error }}</p>

      <div class="row" style="margin-top: 14px; justify-content: center; gap: 10px">
        <button class="btn" type="submit" :disabled="loading">
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </button>
        <router-link to="/register" class="btn-outline">Créer un compte</router-link>
      </div>

      <div style="text-align: center; margin-top: 15px">
        <router-link class="mdp-oublie" to="/forgot-password">Mot de passe oublié ?</router-link>
        <p class="helper">Pas de serveur ? Passe en mode local pour tester avec un ami.</p>
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
    const response = await fetch('http://localhost:3000/api/login', {
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
  const pseudo = email.value ? email.value.split('@')[0] : 'Invité'
  userStore.setToken(`local-${Date.now()}`)
  userStore.setUser({ pseudo, email: email.value || 'local@offline' })
  router.push('/match-list')
}
</script>

<style scoped>
.error-msg {
  color: #ff6b6b;
  text-align: center;
  margin-top: 10px;
}
</style>

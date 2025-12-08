<template>
  <main class="container">
    <h1>Connexion</h1>
    <div style="text-align: center; margin-bottom: 20px">
      <img src="@/assets/logo.svg" alt="logo" style="width: 150px" />
    </div>

    <form class="card" @submit.prevent="handleLogin">
      <div class="grid2">
        <input v-model="email" class="input" type="email" required placeholder="Email" />
        <input
          v-model="password"
          class="input"
          type="password"
          required
          placeholder="Mot de passe"
        />
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <div class="row" style="margin-top: 14px; justify-content: center; gap: 10px">
        <button class="btn" type="submit">Se Connecter</button>
        <router-link to="/register" class="btn-outline">Créer un compte</router-link>
      </div>

      <div style="text-align: center; margin-top: 15px">
        <router-link class="mdp-oublie" to="/forgot-password">Mot de passe oublié ?</router-link>
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
const router = useRouter()
const userStore = useUserStore()

const handleLogin = async () => {
  error.value = ''
  try {
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })

    const data = await response.json()

    if (response.ok) {
      // C'est ici que ça change : on reçoit un token maintenant !
      userStore.setToken(data.token)
      // Optionnel : stocker l'user dans le store aussi
      // userStore.setUser(data.user);
      router.push('/match-list')
    } else {
      error.value = data.error || 'Erreur de connexion'
    }
  } catch (e) {
    error.value = 'Impossible de joindre le serveur'
  }
}
</script>

<style scoped>
/* Ajoute ici le CSS des inputs/boutons de ton fichier common.css */
.container {
  /* ... */
}
.card {
  /* ... */
}
.input {
  /* ... style de common.css */
}
.btn {
  /* ... style de common.css */
}
.error-msg {
  color: #ff6b6b;
  text-align: center;
  margin-top: 10px;
}
</style>

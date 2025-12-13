<template>
  <main class="container">
    <h1>Creer un compte</h1>
    <form class="card" @submit.prevent="handleRegister">
      <p class="section-title">Profil</p>
      <div class="grid3">
        <input v-model="form.pseudo" class="input" type="text" required placeholder="Pseudo" />
        <input v-model="form.prenom" class="input" type="text" required placeholder="Prenom" />
        <input v-model="form.nom" class="input" type="text" required placeholder="Nom" />
        <input v-model="form.email" class="input" type="email" required placeholder="Email" />
        <input
          v-model="form.password"
          class="input"
          type="password"
          required
          minlength="6"
          placeholder="Mot de passe"
        />
        <input
          v-model="form.confirmPassword"
          class="input"
          type="password"
          required
          minlength="6"
          placeholder="Confirmer le mot de passe"
        />
      </div>

      <p class="helper">Mot de passe : 6 caracteres minimum, garde un pseudo unique.</p>
      <p v-if="error" class="feedback error-msg">{{ error }}</p>

      <div class="row" style="margin-top: 14px; justify-content: center">
        <button class="btn" type="submit">Creer le compte</button>
        <router-link to="/" class="btn-outline" style="text-decoration: none">Annuler</router-link>
      </div>
    </form>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const error = ref('')
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const form = reactive({
  pseudo: '',
  prenom: '',
  nom: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const handleRegister = async () => {
  error.value = ''
  if (form.password !== form.confirmPassword) {
    error.value = 'Les mots de passe doivent etre identiques.'
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await response.json()

    if (response.ok) {
      userStore.setToken(data.token ?? `local-${Date.now()}`)
      userStore.setUser(data.user ?? { pseudo: form.pseudo, email: form.email })
      router.push('/match-list')
    } else {
      error.value = data.error || 'Une erreur est survenue.'
    }
  } catch (e) {
    error.value = "Serveur inaccessible : lance l'API ou connecte-toi en mode local."
  }
}
</script>

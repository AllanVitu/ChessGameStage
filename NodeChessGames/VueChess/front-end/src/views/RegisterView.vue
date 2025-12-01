<template>
  <main class="container">
    <h1>Inscription</h1>
    <form class="card" @submit.prevent="handleRegister">
      <div class="grid3">
        <input v-model="form.pseudo" class="input" type="text" required placeholder="Pseudo">
        <input v-model="form.prenom" class="input" type="text" required placeholder="Prénom">
        <input v-model="form.nom" class="input" type="text" required placeholder="Nom">
        <input v-model="form.email" class="input" type="email" required placeholder="Email">
        <input v-model="form.password" class="input" type="password" required placeholder="Mot de passe">
        <input v-model="form.confirmPassword" class="input" type="password" required placeholder="Confirmer le mot de passe">
      </div>
      
      <p v-if="error" style="color: #ff6b6b; text-align: center;">{{ error }}</p>

      <div class="row" style="margin-top:14px; justify-content: center;">
        <button class="btn" type="submit">Créer le compte</button>
        <router-link to="/" class="btn-outline" style="text-decoration:none">Annuler</router-link>
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

const form = reactive({
  pseudo: '', prenom: '', nom: '', email: '', password: '', confirmPassword: ''
})

const handleRegister = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await response.json()

    if (response.ok) {
      userStore.setToken(data.token) 
      router.push('/match-list')
    } else {
      error.value = data.error
    }
  } catch (e) {
    error.value = "Erreur serveur"
  }
}
</script>
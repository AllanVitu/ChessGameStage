<template>
  <main class="container">
    <h1>WarChess</h1>
    <div style="text-align: center; margin-bottom: 20px;">
        <img src="@/assets/logo.svg" alt="logo" style="width: 150px;">
    </div>
    
    <form class="card" @submit.prevent="handleLogin">
      <div class="grid2">
        <input v-model="email" class="input" type="email" required placeholder="Email">
        <input v-model="password" class="input" type="password" required placeholder="Mot de passe">
      </div>
      <p v-if="error" style="color: #ff6b6b; text-align: center;">{{ error }}</p>
      
      <div class="row" style="margin-top:14px; justify-content: center;">
        <button class="btn-outline" type="submit">Se Connecter</button>
        <router-link to="/register" class="btn-outline2" style="text-decoration:none">S'inscrire</router-link>
      </div>
      <br/>
      <router-link class="mdp-oublie" to="/forgot-password" style="text-align: center; display: block;">Mot de passe oublié ?</router-link>
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
  try {
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    })
    const data = await response.json()
    
    if (response.ok) {
      userStore.setToken(data.token)
      router.push('/match-list')
    } else {
      error.value = data.error
    }
  } catch (e) {
    error.value = "Erreur de connexion au serveur"
  }
}
</script>
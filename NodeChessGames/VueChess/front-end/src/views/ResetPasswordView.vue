<template>
  <main class="container">
    <h1>Réinitialisation</h1>
    <form class="card" @submit.prevent="resetPwd">
      <input v-model="newPassword" class="input" type="password" required placeholder="Nouveau mot de passe">
      <input v-model="confirmNewPassword" class="input" type="password" required placeholder="Confirmer nouveau mot de passe">
      
      <p v-if="error" style="color: #ff6b6b; text-align: center;">{{ error }}</p>
      <p v-if="success" style="color: #4cd137; text-align: center;">Mot de passe changé ! Redirection...</p>

      <div class="row" style="margin-top: 14px; justify-content: center;">
        <button class="btn" type="submit">Valider</button>
      </div>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const newPassword = ref('')
const confirmNewPassword = ref('')
const error = ref('')
const success = ref(false)

// Récupération de l'email depuis l'URL (lien simulé dans le backend)
const email = route.query.email

const resetPwd = async () => {
  const response = await fetch('http://localhost:3000/api/reset-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: email, 
        newPassword: newPassword.value, 
        confirmNewPassword: confirmNewPassword.value 
      })
  })
  const data = await response.json()
  
  if (response.ok) {
    success.value = true
    setTimeout(() => router.push('/'), 2000)
  } else {
    error.value = data.error
  }
}
</script>
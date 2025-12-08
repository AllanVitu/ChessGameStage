<template>
  <main class="container">
    <h1>Mot de passe oublié</h1>
    <form class="card" @submit.prevent="sendLink">
      <p style="text-align: center; margin-bottom: 15px">
        Saisissez votre email pour recevoir un lien de réinitialisation.
      </p>
      <input v-model="email" class="input" type="email" required placeholder="Votre E-Mail" />

      <p v-if="message" style="color: #4cd137; text-align: center">{{ message }}</p>

      <div class="row" style="margin-top: 14px; justify-content: center">
        <button class="btn" type="submit">Envoyer</button>
        <router-link to="/" class="btn-outline" style="text-decoration: none">Retour</router-link>
      </div>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const message = ref('')

const sendLink = async () => {
  const response = await fetch('http://localhost:3000/api/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.value }),
  })
  const data = await response.json()
  message.value = data.message
}
</script>

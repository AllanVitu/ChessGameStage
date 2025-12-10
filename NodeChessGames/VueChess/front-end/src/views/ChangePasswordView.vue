<template>
  <main class="container">
    <h1>Changer le mot de passe</h1>
    <form class="card" @submit.prevent="changePassword">
      <div class="grid2">
        <input
          v-model="currentPassword"
          class="input"
          type="password"
          required
          placeholder="Ancien mot de passe"
        />
        <input
          v-model="newPassword"
          class="input"
          type="password"
          required
          placeholder="Nouveau mot de passe"
        />
        <input
          v-model="confirmNewPassword"
          class="input"
          type="password"
          required
          placeholder="Confirmer le nouveau mot de passe"
        />
      </div>

      <p v-if="error" class="feedback error-msg">{{ error }}</p>
      <p v-if="success" class="feedback success-msg">Mot de passe mis a jour.</p>

      <div class="row" style="margin-top: 14px; justify-content: center">
        <button class="btn" type="submit">Enregistrer</button>
        <router-link to="/profile" class="btn-outline">Retour</router-link>
      </div>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const currentPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const error = ref('')
const success = ref(false)

const changePassword = async () => {
  error.value = ''
  success.value = false
  if (newPassword.value !== confirmNewPassword.value) {
    error.value = 'Les mots de passe ne correspondent pas.'
    return
  }

  // Simulation d'appel API
  await new Promise((resolve) => setTimeout(resolve, 400))
  success.value = true
}
</script>

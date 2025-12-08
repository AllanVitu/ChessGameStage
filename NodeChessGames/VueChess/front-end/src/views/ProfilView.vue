<template>
  <main class="container">
    <router-link style="font-size: 30px; text-decoration: none" to="/match-list"
      >&#128281;</router-link
    >
    <h1>Profil User</h1>

    <div v-if="user" class="card">
      <div class="row" style="align-items: center; margin-bottom: 10px">
        <label>Pseudo: </label>
        <input v-model="user.pseudo" class="input" />
      </div>

      <div class="grid3">
        <input v-model="user.nom" class="input" placeholder="Nom" />
        <input v-model="user.prenom" class="input" placeholder="Prénom" />
        <input v-model="user.email" class="input" placeholder="E-mail" />
      </div>

      <p v-if="message" style="color: #4cd137; text-align: center">{{ message }}</p>

      <div
        class="row"
        style="margin-top: 20px; align-items: center; justify-content: space-between"
      >
        <router-link
          class="btn-outline"
          to="/change-password"
          style="font-size: 0.9rem; text-decoration: none"
          >Changer mot de passe</router-link
        >

        <div style="display: flex; gap: 10px">
          <router-link class="btn-outline" to="/match-list" style="text-decoration: none"
            >Annuler</router-link
          >
          <button class="btn" @click="updateProfile">Valider</button>
        </div>

        <button class="btn" style="background-color: #ff6b6b" @click="logout">Déconnexion</button>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'

// 1. On définit à quoi ressemble un utilisateur pour rassurer TypeScript
interface UserData {
  id: number | string
  pseudo: string
  nom: string
  prenom: string
  email: string
}

const userStore = useUserStore()
const router = useRouter()

// 2. On initialise avec des valeurs par défaut sûres
// Si le store est vide, on met des chaînes vides pour éviter les erreurs
const user = ref<UserData>({
  id: userStore.user?.id || 0,
  pseudo: userStore.user?.pseudo || '',
  nom: userStore.user?.nom || '',
  prenom: userStore.user?.prenom || '',
  email: userStore.user?.email || '',
})

const message = ref('')

const updateProfile = async () => {
  // Petite sécurité : si pas d'ID, on arrête
  if (!user.value.id) return

  try {
    const response = await fetch(`http://localhost:3000/api/users/${user.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user.value),
    })

    if (response.ok) {
      message.value = 'Profil mis à jour'
      // On met à jour le store avec les nouvelles données
      userStore.user = { ...user.value }
    } else {
      message.value = 'Erreur lors de la mise à jour'
    }
  } catch (error) {
    console.error(error)
    message.value = 'Erreur de connexion serveur'
  }
}

const logout = () => {
  userStore.logout()
  router.push('/')
}
</script>

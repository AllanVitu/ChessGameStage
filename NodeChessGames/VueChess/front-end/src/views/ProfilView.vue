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

      <p v-if="message" class="feedback success-msg">{{ message }}</p>

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
import { storeToRefs } from 'pinia'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'
import router from '../router'

const userStore = useUserStore()
// On utilise une valeur par défaut (objet vide) si user est null
const user = ref({ ...(userStore.user || {}) })
const message = ref('')

const updateProfile = async () => {
  if (!user.value.id) {
    message.value = 'Profil local mis à jour (non synchronisé)'
    userStore.setUser(user.value)
    return
  }

  const response = await fetch(`http://localhost:3000/api/users/${user.value.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user.value),
  })

  if (response.ok) {
    message.value = 'Profil mis à jour'
    userStore.setUser(user.value)
  }
}

const logout = () => {
  userStore.logout()
  router.push('/')
}
</script>

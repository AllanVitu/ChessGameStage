<template>
  <main class="container">
    <router-link style="font-size: 30px; text-decoration: none" to="/match-list">&#128281;</router-link>
    <h1>Profil User</h1>

    <div v-if="user" class="card">
      <div class="row" style="align-items: center; margin-bottom: 10px">
        <label>Pseudo: </label>
        <input v-model="user.pseudo" class="input" />
      </div>

      <div class="avatar-wrapper">
        <div class="avatar-preview">
          <img v-if="avatarPreview" :src="avatarPreview" alt="Avatar" />
          <span v-else>{{ avatarLetter }}</span>
        </div>
        <div style="flex: 1">
          <p class="section-title" style="margin-bottom: 10px">Avatar</p>
          <div class="row" style="align-items: center; gap: 10px">
            <input
              ref="fileInput"
              type="file"
              accept="image/png, image/jpeg"
              style="display: none"
              @change="onFileChange"
            />
            <button class="btn-outline2" type="button" @click="openFilePicker">
              Choisir une image
            </button>
            <span class="helper">PNG ou JPEG, 1.5 Mo max</span>
          </div>
        </div>
      </div>

      <div class="grid3">
        <input v-model="user.nom" class="input" placeholder="Nom" />
        <input v-model="user.prenom" class="input" placeholder="Prenom" />
        <input v-model="user.email" class="input" placeholder="E-mail" />
      </div>

      <p v-if="message" class="feedback success-msg">{{ message }}</p>

      <div class="row" style="margin-top: 20px; align-items: center; justify-content: space-between">
        <div style="display: flex; gap: 10px">
          <router-link class="btn-outline" to="/match-list" style="text-decoration: none">
            Annuler
          </router-link>
          <button class="btn" @click="updateProfile">Valider</button>
        </div>

        <button class="btn" style="background-color: #ff6b6b" @click="logout">Deconnexion</button>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUserStore } from '../stores/user'
import router from '../router'
import type { UserProfile } from '../stores/user'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const userStore = useUserStore()
const user = ref<UserProfile>({ ...(userStore.user || {}) })
const message = ref('')
const avatarPreview = ref<string>(user.value.avatar || '')
const fileInput = ref<HTMLInputElement | null>(null)

const avatarLetter = computed(() => (user.value.pseudo || user.value.email || '?').charAt(0).toUpperCase())

const openFilePicker = () => {
  fileInput.value?.click()
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const validTypes = ['image/png', 'image/jpeg']
  const MAX_SIZE = 1.5 * 1024 * 1024

  if (!validTypes.includes(file.type)) {
    message.value = 'Formats acceptes: PNG ou JPEG'
    target.value = ''
    return
  }

  if (file.size > MAX_SIZE) {
    message.value = 'Image trop volumineuse (max 1.5 Mo)'
    target.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    const result = reader.result as string
    user.value.avatar = result
    avatarPreview.value = result
    message.value = 'Avatar charge (pensez a valider)'
  }
  reader.readAsDataURL(file)
}

const updateProfile = async () => {
  message.value = ''

  if (!user.value.id) {
    message.value = 'Profil local mis a jour (non synchronise)'
    userStore.setUser(user.value)
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${user.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user.value),
    })

    const data = await response.json()

    if (response.ok) {
      message.value = 'Profil mis a jour'
      userStore.setUser(data.user || user.value)
      avatarPreview.value = data.user?.avatar || user.value.avatar || ''
    } else {
      message.value = data.error || 'Erreur lors de la mise a jour du profil'
    }
  } catch (error) {
    message.value = 'Impossible de joindre le serveur. Profil non synchronise.'
  }
}

const logout = () => {
  userStore.logout()
  router.push('/')
}
</script>

<style scoped>
.avatar-wrapper {
  display: flex;
  gap: 16px;
  align-items: center;
  margin: 10px 0 18px;
}

.avatar-preview {
  width: 96px;
  height: 96px;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--text-muted);
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>

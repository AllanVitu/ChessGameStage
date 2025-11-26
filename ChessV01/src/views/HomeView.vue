<template>
  <main class="container">
    <h1>WarChess</h1>
    <br />
    <form class="card" @submit.prevent="login">
      <div class="grid2">
        <input class="input" type="email" required placeholder="Email" v-model="email">
        <input class="input" type="password" required placeholder="Mot de passe" v-model="password">
      </div>

      <div class="row" style="margin-top:14px;">
        <button class="btn-outline" type="submit">Se Connecter</button>
        <router-link to="/signin" class="btn-outline2">S'inscrire</router-link>
      </div>
      <br/>
      <router-link class="mdp-oublie center" to="/change-password">Mot de passe oublié ?</router-link>
    </form>

    <img src="@/assets/logo.png" alt="logo" style="width: 400px;" v-if="false"> </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const router = useRouter();

const login = () => {
  console.log("Connexion...", email.value);
  // Simulation de connexion, on redirige vers la liste
  router.push('/matches');
};
</script>
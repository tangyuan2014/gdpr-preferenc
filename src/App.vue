<template>
  <main>
    <h1>GDPR demo — user storage</h1>

    <section class="card">
      <h2>Create user (consent required)</h2>
      <p class="privacy-note"><strong>Privacy notice:</strong> We store only the data you provide for the stated purpose. You can request an export or deletion of your data. This demo records consent metadata for traceability.</p>
      <form @submit.prevent="createUser">
        <label>
          Name
          <input v-model="form.name" />
        </label>
        <label>
          Email
          <input v-model="form.email" />
        </label>
        <label>
          <input type="checkbox" v-model="form.consent" /> I consent to storage of my data
        </label>
        <button type="submit">Create</button>
      </form>
      <div v-if="lastCreated">Created: {{ lastCreated }}</div>
    </section>

    <section class="card">
      <h2>Users</h2>
      <button @click="loadUsers">Refresh</button>
      <ul>
        <li v-for="u in users" :key="u.id">
          {{ u.email }} — <button @click="exportUser(u.id)">Export</button>
          <button @click="deleteUser(u.id)">Delete</button>
        </li>
      </ul>
    </section>

    <section v-if="exported" class="card">
      <h2>Exported data</h2>
      <div>
        <p><strong>Exported at:</strong> {{ exported.exportedAt }}</p>
        <p v-if="exported.exportedBy"><strong>Exported by:</strong> {{ exported.exportedBy }}</p>
        <p v-if="exported.user && exported.user.consentTimestamp"><strong>Consent given at:</strong> {{ exported.user.consentTimestamp }}</p>
        <pre>{{ JSON.stringify(exported.user, null, 2) }}</pre>
      </div>
    </section>
  </main>
</template>

<script setup>
// Frontend notes:
// - The frontend uses the `VITE_API_URL` environment variable (set in compose) to talk to the API.
// - This UI demonstrates GDPR flows: create (with consent), list, export, and delete.
// - In production, you must authenticate users before allowing exports/deletions.
import { ref } from 'vue'

// API base URL — provided by docker-compose via VITE_API_URL, fallback to localhost for local dev.
const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Reactive state
const form = ref({ name: '', email: '', consent: false })
const users = ref([])
const lastCreated = ref(null)
const exported = ref(null)

// createUser: calls POST /users. The API requires `consent: true`.
async function createUser() {
  try {
    const res = await fetch(`${API}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'create_failed')
    lastCreated.value = data.id
    // Refresh list after create to show the new user
    await loadUsers()
  } catch (err) {
    // Simple error handling for the demo
    alert('Create failed: ' + err.message)
  }
}

// loadUsers: GET /users returns a lightweight listing
async function loadUsers() {
  const res = await fetch(`${API}/users`)
  users.value = await res.json()
}

// exportUser: GET /users/:id/export — returns the exported data package
async function exportUser(id) {
  const res = await fetch(`${API}/users/${id}/export`)
  exported.value = await res.json()
}

// deleteUser: DELETE /users/:id — prompts for confirmation (demo)
async function deleteUser(id) {
  if (!confirm('Delete user and all their data?')) return
  const res = await fetch(`${API}/users/${id}`, { method: 'DELETE' })
  if (res.ok) {
    await loadUsers()
    exported.value = null
  } else {
    alert('Delete failed')
  }
}

// Load users on mount
loadUsers()
</script>

<style>
body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; padding: 1rem; }
.card { border: 1px solid #ddd; padding: 1rem; margin: 1rem 0 }
label { display: block; margin-bottom: .5rem }
input[type="text"], input[type="email"] { width: 100%; padding: .25rem }
</style>

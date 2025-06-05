import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    adminId: localStorage.getItem('adminId') || '',
    username: localStorage.getItem('username') || '',
    token: localStorage.getItem('token') || '',
    isAuthenticated: localStorage.getItem('isAuthenticated') === 'true'
  }),

  actions: {
    setUserInfo(adminId, username, token) {
      this.adminId = adminId
      this.username = username
      this.token = token
      this.isAuthenticated = true
      
      localStorage.setItem('adminId', adminId)
      localStorage.setItem('username', username)
      localStorage.setItem('token', token)
      localStorage.setItem('isAuthenticated', 'true')
    },

    clearUserInfo() {
      this.adminId = ''
      this.username = ''
      this.token = ''
      this.isAuthenticated = false
      
      localStorage.removeItem('adminId')
      localStorage.removeItem('username')
      localStorage.removeItem('token')
      localStorage.removeItem('isAuthenticated')
    }
  }
}) 
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/project-omaha/',
  server: {
    open: true
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        '2347': '2347/index.html',
        'get-poul-a-beer': 'get-poul-a-beer/index.html'
      }
    }
  }
})

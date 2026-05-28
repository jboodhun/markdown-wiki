import react from '@vitejs/plugin-react';

export default {
  plugins: [react()],
  server: {
    proxy: {
      '/api': process.env.API_TARGET || 'http://localhost:3020',
      '/media': process.env.API_TARGET || 'http://localhost:3020'
    }
  }
};

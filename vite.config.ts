import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import WindiCSS from 'vite-plugin-windicss';

export default defineConfig((env) => ({
  plugins: [solidPlugin({hot: false}), WindiCSS()],
  define: {
    'process.env.BABEL_TYPES_8_BREAKING': 'true',
    'process.env.NODE_DEBUG': 'false',
    ...(env.command == 'build' ? {} : { global: 'globalThis' }),
  },
  optimizeDeps: {
    include: ['babel-preset-solid', 'babel-plugin-jsx-dom-expressions', '@babel/helper-module-imports']
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      include: [/babel-preset-solid/, /babel-plugin-jsx-dom-expressions/, /@babel\/helper-module-imports/, /node_modules/]
    },
    rollupOptions: {
      output: {
        manualChunks: {},
      },
    },
  },
}));

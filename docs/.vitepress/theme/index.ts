import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import TeraDemo from './TeraDemo.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('TeraDemo', TeraDemo);
  },
} satisfies Theme;

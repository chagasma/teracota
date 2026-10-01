<script setup lang="ts">
// Demonstração da landing: anima os frames reais da skin da Tera nas reações que o
// app tem hoje. Só reações implementadas entram aqui.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useData, withBase } from 'vitepress';

interface Scene {
  id: string;
  pose: string;
  durations: number[];
  prop: string;
  label: { pt: string; en: string };
  caption: { pt: string; en: string };
  say?: { pt: string; en: string };
}

const SCENES: Scene[] = [
  {
    id: 'read', pose: 'work', durations: [160, 160, 160, 160], prop: '📖',
    label: { pt: 'Lendo', en: 'Reading' },
    caption: { pt: 'O Claude abriu um arquivo: ela senta no notebook.', en: 'Claude opened a file: she sits at the laptop.' },
  },
  {
    id: 'edit', pose: 'work', durations: [160, 160, 160, 160], prop: '⌨️',
    label: { pt: 'Editando', en: 'Editing' },
    caption: { pt: 'O Claude está editando código.', en: 'Claude is editing code.' },
  },
  {
    id: 'error', pose: 'error', durations: [180, 150, 150, 260], prop: '💢',
    label: { pt: 'Erro', en: 'Error' },
    caption: { pt: 'Uma ferramenta falhou.', en: 'A tool failed.' },
    say: { pt: 'Ops...', en: 'Oops...' },
  },
  {
    id: 'permission', pose: 'wave', durations: [140, 140, 140, 140], prop: '🙋',
    label: { pt: 'Permissão', en: 'Permission' },
    caption: { pt: 'O Claude precisa da sua permissão.', en: 'Claude needs your permission.' },
    say: { pt: 'Ei, preciso de você!', en: 'Hey, I need you!' },
  },
  {
    id: 'done', pose: 'happy', durations: [170, 140, 180, 230], prop: '✨',
    label: { pt: 'Terminou', en: 'Done' },
    caption: { pt: 'Tarefa concluída.', en: 'Task finished.' },
    say: { pt: 'Terminei! ✨', en: 'All done! ✨' },
  },
  {
    id: 'walk', pose: 'walk', durations: [140, 140, 140, 140], prop: '',
    label: { pt: 'Passeando', en: 'Wandering' },
    caption: { pt: 'Sem tarefa: ela passeia pela tela.', en: 'Nothing to do: she wanders around your screen.' },
  },
  {
    id: 'sleep', pose: 'sleep', durations: [360, 360, 360, 360], prop: '💤',
    label: { pt: 'Cochilando', en: 'Napping' },
    caption: { pt: 'Muito tempo parada: ela cochila.', en: 'Idle for a while: she takes a nap.' },
  },
];

const { lang } = useData();
const en = computed(() => lang.value.startsWith('en'));
const t = (text: { pt: string; en: string }) => (en.value ? text.en : text.pt);

const index = ref(0);
const frame = ref(0);
const autoplay = ref(true);
const reducedMotion = ref(false);
const scene = computed(() => SCENES[index.value]!);
const src = computed(() => withBase(`/tera/${scene.value.pose}-${frame.value + 1}.png`));

let frameTimer: ReturnType<typeof setTimeout> | undefined;
let sceneTimer: ReturnType<typeof setTimeout> | undefined;

function tickFrame() {
  clearTimeout(frameTimer);
  if (reducedMotion.value) return;
  frameTimer = setTimeout(() => {
    frame.value = (frame.value + 1) % 4;
    tickFrame();
  }, scene.value.durations[frame.value] ?? 160);
}

function scheduleNextScene() {
  clearTimeout(sceneTimer);
  if (!autoplay.value || reducedMotion.value) return;
  sceneTimer = setTimeout(() => {
    index.value = (index.value + 1) % SCENES.length;
  }, 3200);
}

function choose(i: number) {
  autoplay.value = false;
  index.value = i;
}

function onKey(e: KeyboardEvent, i: number) {
  const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
  if (!delta) return;
  e.preventDefault();
  const next = (i + delta + SCENES.length) % SCENES.length;
  choose(next);
  (document.getElementById(`tera-scene-${SCENES[next]!.id}`) as HTMLElement | null)?.focus();
}

watch(index, () => {
  frame.value = 0;
  tickFrame();
  scheduleNextScene();
});
watch(autoplay, scheduleNextScene);

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // pré-carrega todos os frames pra troca não piscar
  for (const s of SCENES) for (let i = 1; i <= 4; i++) new Image().src = withBase(`/tera/${s.pose}-${i}.png`);
  tickFrame();
  scheduleNextScene();
});

onBeforeUnmount(() => {
  clearTimeout(frameTimer);
  clearTimeout(sceneTimer);
});
</script>

<template>
  <div class="tera-demo">
    <div class="stage">
      <p class="bubble" :class="{ hidden: !scene.say }" aria-live="polite">{{ scene.say ? t(scene.say) : '' }}</p>
      <div class="figure">
        <img :src="src" width="200" height="200" :alt="t(scene.caption)" />
        <span v-if="scene.prop" class="prop" aria-hidden="true">{{ scene.prop }}</span>
      </div>
    </div>

    <div class="controls">
      <div class="scenes" role="tablist" :aria-label="en ? 'Reactions' : 'Reações'">
        <button
          v-for="(s, i) in SCENES"
          :id="`tera-scene-${s.id}`"
          :key="s.id"
          role="tab"
          :aria-selected="i === index"
          :tabindex="i === index ? 0 : -1"
          :class="{ active: i === index }"
          @click="choose(i)"
          @keydown="onKey($event, i)"
        >
          {{ t(s.label) }}
        </button>
      </div>
      <p class="caption">{{ t(scene.caption) }}</p>
      <button v-if="!reducedMotion" class="autoplay" :aria-pressed="autoplay" @click="autoplay = !autoplay">
        {{ autoplay ? (en ? '⏸ Pause tour' : '⏸ Pausar') : (en ? '▶ Play tour' : '▶ Passear pelas reações') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.tera-demo {
  display: grid;
  grid-template-columns: minmax(0, 260px) minmax(0, 1fr);
  gap: 32px;
  align-items: center;
  padding: 24px;
  border-radius: 16px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

@media (max-width: 640px) {
  .tera-demo {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
}

.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 290px;
  justify-content: flex-end;
}

.bubble {
  margin: 0 0 8px;
  padding: 8px 14px;
  border: 2px solid var(--tera-ink);
  border-radius: 14px;
  background: #fffdf8;
  color: var(--tera-ink);
  font-size: 15px;
  font-weight: 500;
  box-shadow: 0 3px 0 var(--tera-ink);
  transition: opacity 0.2s;
  min-height: 1.5em;
}

.bubble.hidden {
  opacity: 0;
}

.figure {
  position: relative;
  width: 200px;
  height: 200px;
}

.figure img {
  width: 200px;
  height: 200px;
}

.prop {
  position: absolute;
  top: 8%;
  right: 6%;
  font-size: 26px;
}

.scenes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 640px) {
  .scenes {
    justify-content: center;
  }
}

.scenes button,
.autoplay {
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.scenes button:hover,
.autoplay:hover {
  border-color: var(--vp-c-brand-1);
}

.scenes button.active {
  background: var(--vp-button-brand-bg);
  border-color: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
}

.scenes button:focus-visible,
.autoplay:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.caption {
  margin: 16px 0;
  font-size: 16px;
  color: var(--vp-c-text-2);
}

.autoplay {
  font-size: 13px;
}
</style>

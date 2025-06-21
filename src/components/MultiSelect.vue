<template>
  <div
    :class="['custom-multiselect', { dark: isDark }]"
    @click="toggleDropdown"
    @keydown.escape="closeDropdown"
    tabindex="0"
    ref="container"
  >
    <div class="selected-items">
      <span
        v-for="(item, index) in modelValue"
        :key="item.id"
        class="selected-item"
      >
        {{ item.name }}
        <button type="button" class="remove-btn" @click.stop="removeItem(index)">
          &times;
        </button>
      </span>
      <input
        v-if="searchable"
        type="text"
        v-model="search"
        @focus="openDropdown"
        placeholder="Select..."
        class="search-input"
      />
    </div>

    <div v-if="dropdownOpen" class="options-list" ref="dropdown">
      <div
        v-for="option in filteredOptions"
        :key="option.id"
        class="option"
        :class="{ selected: isSelected(option) }"
        @click.stop="selectOption(option)"
      >
        {{ option.name }}
      </div>
      <div v-if="filteredOptions.length === 0" class="no-options">
        No options found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';

interface Option {
  id: string | number;
  name: string;
}

const props = defineProps<{
  modelValue: Option[];
  options: Option[];
  searchable?: boolean;
  dark?: boolean;
}>();

const emit = defineEmits(['update:modelValue']);

const search = ref('');
const dropdownOpen = ref(false);
const isDark = computed(() => props.dark ?? false);

const filteredOptions = computed(() => {
  if (!search.value) return props.options;

  return props.options.filter((opt) =>
    opt.name.toLowerCase().includes(search.value.toLowerCase())
  );
});

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
}

function openDropdown() {
  dropdownOpen.value = true;
}

function closeDropdown() {
  dropdownOpen.value = false;
  search.value = '';
}

function selectOption(option: Option) {
  const exists = props.modelValue.find((item) => item.id === option.id);
  let newValue = [];

  if (exists) {
    // Remove it
    newValue = props.modelValue.filter((item) => item.id !== option.id);
  } else {
    // Add it
    newValue = [...props.modelValue, option];
  }

  emit('update:modelValue', newValue);
}

function isSelected(option: Option) {
  return props.modelValue.some((item) => item.id === option.id);
}

function removeItem(index: number) {
  const newValue = [...props.modelValue];
  newValue.splice(index, 1);
  emit('update:modelValue', newValue);
}

// Close dropdown on click outside
const container = ref<HTMLElement | null>(null);

function onClickOutside(event: MouseEvent) {
  if (!container.value?.contains(event.target as Node)) {
    closeDropdown();
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside);
});
</script>

<style scoped>
.custom-multiselect {
  position: relative;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  background: white;
  color: #333;
  min-width: 250px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  user-select: none;
}

.custom-multiselect.dark {
  background: #1f2937;
  border-color: #374151;
  color: #f9fafb;
}

.selected-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: center;
  min-height: 2.5rem;
}

.selected-item {
  background: #2563eb;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  font-size: 0.875rem;
}

.selected-item .remove-btn {
  margin-left: 0.25rem;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  font-weight: bold;
  line-height: 1;
  padding: 0 0.25rem;
}

.selected-item .remove-btn:hover {
  color: #dbeafe;
}

.search-input {
  border: none;
  outline: none;
  flex-grow: 1;
  font-size: 1rem;
  padding: 0.25rem 0.5rem;
  background: transparent;
  color: inherit;
  min-width: 60px;
  cursor: text;
}

.options-list {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  background: white;
  z-index: 9999;
}

.custom-multiselect.dark .options-list {
  background: #111827;
  border-color: #374151;
  color: #f9fafb;
}

.option {
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.option:hover,
.option.selected {
  background-color: #2563eb;
  color: white;
}

.no-options {
  padding: 0.5rem 1rem;
  color: #999;
  font-style: italic;
  user-select: none;
}
</style>

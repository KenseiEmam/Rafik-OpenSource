<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t, tm, rt } = useI18n();
</script>

<template>
  <div class="dark text-body flex-1 relative">
    <div class="container mx-auto px-4 py-16">
      <div class="max-w-3xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <!-- Main Title -->
        <h1 class="text-3xl font-bold text-gray-800 mb-4">
          {{ t('privacy.title') }}
        </h1>

        <!-- Section 1: Introduction -->
        <section class="mt-6">
          <h2 class="text-2xl font-semibold text-gray-700">
            {{ t('privacy.sections.introduction.title') }}
          </h2>
          <p class="text-gray-600 mt-2">
            {{ t('privacy.sections.introduction.content') }}
          </p>
        </section>

        <!-- Section 2: Information We Collect -->
        <section class="mt-6">
          <h2 class="text-2xl font-semibold text-gray-700">
            {{ t('privacy.sections.informationCollected.title') }}
          </h2>
          <ul class="list-disc list-inside text-gray-600 mt-2">
            <li
              v-for="(item, index) in tm('privacy.sections.informationCollected.items')"
              :key="index"
              v-html="rt(item)"
            ></li>
          </ul>
        </section>

        <!-- Section 3: How We Use Your Information -->
        <section class="mt-6">
          <h2 class="text-2xl font-semibold text-gray-700">
            {{ t('privacy.sections.howWeUse.title') }}
          </h2>
          <ul class="list-disc list-inside text-gray-600 mt-2">
            <li v-for="(item, index) in tm('privacy.sections.howWeUse.items')" :key="index">
              {{ item }}
            </li>
          </ul>
        </section>

        <!-- Section 4: Data Sharing and Disclosure -->
        <section class="mt-6">
          <h2 class="text-2xl font-semibold text-gray-700">
            {{ t('privacy.sections.dataSharing.title') }}
          </h2>
          <ul class="list-disc list-inside text-gray-600 mt-2">
            <li
              v-for="(item, index) in tm('privacy.sections.dataSharing.items')"
              :key="index"
              v-html="rt(item)"
            ></li>
          </ul>
        </section>

        <!-- Section 5: Data Security -->
        <section class="mt-6">
          <h2 class="text-2xl font-semibold text-gray-700">
            {{ t('privacy.sections.dataSecurity.title') }}
          </h2>
          <p class="text-gray-600 mt-2">
            {{ t('privacy.sections.dataSecurity.content') }}
          </p>
        </section>

        <!-- Section 6: Your Rights and Choices -->
        <section class="mt-6">
          <h2 class="text-2xl font-semibold text-gray-700">
            {{ t('privacy.sections.yourRights.title') }}
          </h2>
          <ul class="list-disc list-inside text-gray-600 mt-2">
            <li v-for="(item, index) in tm('privacy.sections.yourRights.items')" :key="index">
              {{ item }}
            </li>
          </ul>
        </section>

        <!-- Section 7: Data Retention -->
        <section class="mt-6">
          <h2 class="text-2xl font-semibold text-gray-700">
            {{ t('privacy.sections.dataRetention.title') }}
          </h2>
          <p class="text-gray-600 mt-2">
            {{ t('privacy.sections.dataRetention.content') }}
          </p>
        </section>

        <!-- Section 8: Children's Privacy -->
        <section class="mt-6">
          <h2 class="text-2xl font-semibold text-gray-700">
            {{ t('privacy.sections.childrensPrivacy.title') }}
          </h2>
          <p class="text-gray-600 mt-2">
            {{ t('privacy.sections.childrensPrivacy.content') }}
          </p>
        </section>

        <!-- Section 9: Changes to This Privacy Policy -->
        <section class="mt-6">
          <h2 class="text-2xl font-semibold text-gray-700">
            {{ t('privacy.sections.policyChanges.title') }}
          </h2>
          <p class="text-gray-600 mt-2">
            {{ t('privacy.sections.policyChanges.content') }}
          </p>
        </section>

        <!-- Section 10: Contact Us -->
        <section class="mt-6">
          <h2 class="text-2xl font-semibold text-gray-700">
            {{ t('privacy.sections.contactUs.title') }}
          </h2>
          <p class="text-gray-600 mt-2">
            {{ t('privacy.sections.contactUs.content') }}
          </p>
        </section>

        <!-- Section 11: Request Account & Data Deletion -->
        <section class="mt-6">
          <h2 class="text-2xl font-semibold text-gray-700">
            {{ t('privacy.sections.accountDeletion.title') }}
          </h2>
          <p
            class="text-gray-600 mt-2"
            v-html="rt(t('privacy.sections.accountDeletion.content'))"
          ></p>
        </section>
      </div>
    </div>
  </div>
</template>

<style>
/* Additional styling if needed */
</style>

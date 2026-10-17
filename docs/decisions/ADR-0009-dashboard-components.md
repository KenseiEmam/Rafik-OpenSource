# ADR 0009 — Owned dashboard components with Unovis and Reka UI

Status: Accepted and implemented locally, 23 September 2026.

## Context

The public-page shell, small timezone datalists and hand-built charts passed geometry checks but left the coach/organization experience difficult to scan and operate. The requested [shadcn-vue chart reference](https://shadcn-vue.com/docs/components/chart) uses Unovis; its component recipes assume styling infrastructure this app does not use.

## Decision

Keep Vue, TypeScript, Rafik tokens and feature modules. Use pinned `@unovis/vue`/`@unovis/ts` for actual chart rendering and `reka-ui` for keyboard/focus-aware combobox, tabs and navigation drawer primitives. These are direct library integrations, not copied shadcn components. Own `MetricChart.vue`, `TimezonePicker.vue` and `DashboardNav.vue`; no Tailwind migration, component-generator layer or new global store.

The desktop staff shell owns a fixed header/sidebar and scrollable main workspace. Long operational collections can scroll within bounded, keyboard-accessible regions. Phone forms retain natural page scrolling; conversation threads retain their specialized bounded layout. Public and trainee surfaces retain their existing shell. Navigation is derived from authorized context and never grants authority.

## Options considered

- **Copy a full shadcn-vue component and Tailwind system:** rejected because it would add a second styling/component framework.
- **Keep the hand-built charts and controls:** rejected because the audited staff workspace needed more capable, keyboard-aware controls and chart interaction.
- **Integrate Unovis and Reka primitives within Rafik-owned components:** selected; this adds focused dependencies and requires continued rendered accessibility/layout review.

Analytics groups activity and delivery/follow-up into tabs, keeps report definitions available on demand, and preserves the last successful report during refresh failure. Charts provide axes, units, keyboard values and table equivalents; counts use integer ticks while measurements retain decimals. A loaded category chart shows at most eight categories per page. Reporting contracts and authorization remain on the API.

Timezone selection uses the browser's IANA catalog plus UTC and any valid persisted alias. Search accepts common renamed cities; offsets are current explanatory labels, not fixed scheduling offsets. Only a selected IANA value is saved. The server continues to validate scheduling/DST independently.

## Consequences

The chart library adds a route-lazy bundle (about 80 kB gzip in the measured R13 build); timezone controls add about 22 kB gzip. Readability, keyboard interaction and maintainable rendering justify these dependencies. Updates must test long/empty/single-point/populated charts, aliases/DST/UTC, portal placement, focus restoration, themes, RTL and breakpoint transitions. A library does not establish product usability: inspect rendered work and keep human observation separate from local automated evidence.

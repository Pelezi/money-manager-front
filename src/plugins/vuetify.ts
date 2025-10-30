import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import { pt } from 'vuetify/locale'
import { defineNuxtPlugin } from '#app'
import 'vuetify/styles'

export default defineNuxtPlugin(nuxtApp => {
  const vuetify = createVuetify({
    components,
    directives,
    theme: { defaultTheme: 'light' },
    icons: { defaultSet: 'mdi' },
    locale: {
      locale: 'pt',
      fallback: 'en',
      messages: { pt },
    },
    defaults: {
      VDatePicker: {
        locale: 'pt',
        firstDayOfWeek: 1,
        showAdjacentMonths: true,
        hideHeader: true,
      },
    },
  })
  nuxtApp.vueApp.use(vuetify)
})

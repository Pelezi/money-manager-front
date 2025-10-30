# Simple Nuxt 3 + Vuetify Starter

This is a simplified starter project with basic authentication flow.

## Structure

### Pages
- **`/`** - Home page (public)
- **`/login`** - Login page (public)
- **`/dashboard`** - Protected dashboard page (requires authentication)

### Layouts
- **`default.vue`** - Simple layout for public pages
- **`dashboard.vue`** - Layout with app bar for authenticated pages

### Features
- ✅ Basic authentication with user store (Pinia)
- ✅ Route protection middleware
- ✅ JWT token handling
- ✅ Session storage for auth persistence
- ✅ Vuetify 3 UI components

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Authentication Flow

1. Users start at home page (`/`)
2. Navigate to login page (`/login`)
3. After successful login, user data is stored in Pinia store
4. Users are redirected to dashboard (`/dashboard`)
5. Protected routes automatically redirect to login if not authenticated

## Customize

- Update the mock login logic in `/src/pages/login.vue`
- Modify user store in `/src/stores/useUserStore.ts`
- Add your API endpoints in `/src/services/client.ts`
- Customize layouts and add more pages as needed

## Note

The current login page uses mock authentication. Replace the login logic with your actual API call.

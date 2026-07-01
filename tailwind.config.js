/** @type {import('tailwindcss').Config} */
// Design direction (spec §13): a chosen dark from the venue world — warm,
// low-luminance, gallery-wall — not default near-black-with-neon. Money and
// chrome stay quiet; the Monument and the artist's name carry the boldness.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#15120e', // page ground — warm near-black, never pure black
        surface: '#1e1a15', // raised surfaces
        line: 'rgba(236, 230, 217, 0.12)', // hairlines
        parchment: '#ece6d9', // primary type
        muted: '#9b9285', // secondary type
        brass: '#c2a36b', // the single accent — stage-light warm; use sparingly
      },
      fontFamily: {
        display: ['Fraunces Variable', 'Fraunces', 'Georgia', 'serif'],
        body: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}

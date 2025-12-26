import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import './index.css'
import App from './App.jsx'

const stripePromise = loadStripe("pk_test_51SA7wQRf3D8pr3UQDQiVh39LBjCKTp7FcgS8l3rIgJjeV83K2LpkEl9ggjnLj4uXwFQ5JVerezfpUpwoma2TBxFO00oOqNuAEH");

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Elements stripe={stripePromise}>
      <App />
    </Elements>
  </StrictMode>,
)

import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './redux/store'
import App from './App.jsx'
import 'bootstrap-icons/font/bootstrap-icons.css';
 
 

// remove this
import "@fortawesome/fontawesome-free/css/all.min.css";
import './app.css'
import ChatBot from './landing/pages/ChatBot.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <ChatBot />
    </Provider>
  </React.StrictMode>,
)
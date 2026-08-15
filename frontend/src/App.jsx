import { useState } from 'react'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('token')))

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
  }

  return isAuthenticated
    ? <Home onLogout={handleLogout} />
    : <Login onLogin={() => setIsAuthenticated(true)} />
}

export default App

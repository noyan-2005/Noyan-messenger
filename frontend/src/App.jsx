import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import Chat from './pages/Chat'
import Auth from './pages/Auth'
import ProtectedRoute from "./components/Auth/ProtectedRoute"
import './App.css'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route
         path="/chat"
         element={
          <ProtectedRoute>
             <Chat />
          </ProtectedRoute>
         }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

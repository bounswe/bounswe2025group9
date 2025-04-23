import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './components/MainLayout'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Foods from './pages/foods/Foods'
import ProposeNewFood from './pages/foods/ProposeNewFood'
import Forum from './pages/forum/Forum'
import ApiExample from './pages/ApiExample'

// app component with react-router setup
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="foods" element={<Foods />} />
          <Route path="foods/propose" element={<ProposeNewFood />} />
          <Route path="forum" element={<Forum />} />
          <Route path="api-examples" element={<ApiExample />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="*" element={<div className="p-8 text-center">Page not found</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

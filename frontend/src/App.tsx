import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './components/MainLayout'
import Home from './pages/Home'
import PersonalizedFeed from './pages/PersonalizedFeed'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Foods from './pages/foods/Foods'
import ProposeNewFood from './pages/foods/ProposeNewFood'
import Forum from './pages/forum/Forum'
import PostDetail from './pages/forum/PostDetail'
import CreatePost from './pages/forum/CreatePost'
import Profile from './pages/Profile'
import UserProfile from './pages/UserProfile'
import ModerationPanel from './pages/admin/ModerationPanel'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import SwaggerPage from './components/SwaggerPage';
import MealPlanner from './pages/mealplanner/MealPlanner'
import FoodCompare from './pages/foods/FoodCompare';
import NutritionTrackingPage from './pages/NutritionTracking';

// app component with react-router setup
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Swagger documentation - completely standalone route */}
          <Route path="/docs" element={<SwaggerPage />} />
          
          <Route path="/" element={<MainLayout />}>
            {/* Public Routes - only login and signup */}
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            
            {/* Protected Routes - all other routes including home */}
            <Route element={<ProtectedRoute />}>
              <Route index element={<PersonalizedFeed />} />
              <Route path="home" element={<Home />} />
              <Route path="foods" element={<Foods />} />
              <Route path="foods/propose" element={<ProposeNewFood />} />
              <Route path="/foods/private/:id/edit" element={<ProposeNewFood />} />
              <Route path="foods/compare" element={<FoodCompare />} />
              <Route path="forum" element={<Forum />} />
              <Route path="forum/post/:postId" element={<PostDetail />} />
              <Route path="forum/create" element={<CreatePost />} />
              <Route path="profile" element={<Profile />} />
              <Route path="user/:username" element={<UserProfile />} />
              <Route path="nutrition" element={<NutritionTrackingPage />} />
              <Route path="mealplanner" element={<MealPlanner/>}/>
            </Route>

            {/* Staff-only Routes - moderation panel */}
            <Route element={<ProtectedRoute requireStaff={true} />}>
              <Route path="admin/moderation" element={<ModerationPanel />} />
            </Route>

            <Route path="*" element={<div className="p-8 text-center">Page not found</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

// import home page component
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Foods from "./pages/foods/Foods";
import Forum from "./pages/forum/Forum";
import ApiExample from "./pages/ApiExample";
import PostDetail from "./pages/forum/PostDetail";
import CreatePost from "./pages/forum/CreatePost";

// simple app component that displays group name
function App() {
  return (
    <div className="app">
      <Home />
    </div>
  );
}

export default App;

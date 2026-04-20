import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import About from './pages/About';
import Profile from './pages/Profile';
import Analyse from './pages/Analyse';
import Records from './pages/Records';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login route is always accessible */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes – require authentication */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/analyse" element={<Analyse />} />
            <Route path="/records" element={<Records />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
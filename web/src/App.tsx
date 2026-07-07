/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginGateProvider } from './contexts/LoginGate';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PostDetail from './pages/PostDetail';
import CreatePost from './pages/CreatePost';
import AboutContact from './pages/AboutContact';
import Admin from './pages/Admin';
import Search from './pages/Search';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastProvider>
          <LoginGateProvider>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="topic/:slug" element={<Home />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="post/:id" element={<PostDetail />} />
                <Route path="create-post" element={<CreatePost />} />
                <Route path="about" element={<AboutContact />} />
                <Route path="admin" element={<Admin />} />
                <Route path="search" element={<Search />} />
                <Route path="profile/:id" element={<Profile />} />
              </Route>
            </Routes>
          </LoginGateProvider>
        </ToastProvider>
      </Router>
    </AuthProvider>
  );
}

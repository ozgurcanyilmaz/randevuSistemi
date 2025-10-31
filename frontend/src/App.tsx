import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { isAuthenticated, getRoles } from './services/auth'
import Login from './pages/Login'
import Register from './pages/Register'
import Admin from './pages/Admin'
import Provider from './pages/Provider'
import UserHome from './pages/UserHome'
import Departments from './pages/admin/Departments'
import Roles from './pages/admin/Roles'
import UserAppointments from './pages/UserAppointments'
import ProviderAppointments from './pages/ProviderAppointments'
import ProviderWaiting from './pages/ProviderWaiting'
import AppLayout from './components/AppLayout'
import ProfilePage from './pages/Profile'
import OperatorHome from './pages/operator/OperatorHome'
import OperatorWalkIn from './pages/operator/OperatorWalkIn'

function PrivateRoute({ children }: { children: JSX.Element }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />
}

function RoleRoute({ children, role }: { children: JSX.Element; role: string }) {
  const roles = getRoles()
  return roles.includes(role) ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><AppLayout><UserHome /></AppLayout></PrivateRoute>} />
        <Route path="/my-appointments" element={<PrivateRoute><AppLayout><UserAppointments /></AppLayout></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><AppLayout><ProfilePage /></AppLayout></PrivateRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<PrivateRoute><RoleRoute role="Admin"><AppLayout><Admin /></AppLayout></RoleRoute></PrivateRoute>} />
        <Route path="/admin/departments" element={<PrivateRoute><RoleRoute role="Admin"><AppLayout><Departments /></AppLayout></RoleRoute></PrivateRoute>} />
        <Route path="/admin/departments/branches" element={<PrivateRoute><RoleRoute role="Admin"><AppLayout><Departments /></AppLayout></RoleRoute></PrivateRoute>} />
        <Route path="/admin/roles" element={<PrivateRoute><RoleRoute role="Admin"><AppLayout><Roles /></AppLayout></RoleRoute></PrivateRoute>} />
        <Route path="/admin/roles/assign-provider" element={<PrivateRoute><RoleRoute role="Admin"><AppLayout><Roles /></AppLayout></RoleRoute></PrivateRoute>} />
        
        {/* Operator Routes */}
        <Route path="/operator" element={<PrivateRoute><RoleRoute role="Operator"><AppLayout><OperatorHome /></AppLayout></RoleRoute></PrivateRoute>} />
        <Route path="/operator/appointments" element={<PrivateRoute><RoleRoute role="Operator"><AppLayout><OperatorHome /></AppLayout></RoleRoute></PrivateRoute>} />
        <Route path="/operator/walk-in" element={<PrivateRoute><RoleRoute role="Operator"><AppLayout><OperatorWalkIn /></AppLayout></RoleRoute></PrivateRoute>} />
        
        {/* Provider Routes */}
        <Route path="/provider" element={<PrivateRoute><RoleRoute role="ServiceProvider"><AppLayout><Provider /></AppLayout></RoleRoute></PrivateRoute>} />
        <Route path="/provider/appointments" element={<PrivateRoute><RoleRoute role="ServiceProvider"><AppLayout><ProviderAppointments /></AppLayout></RoleRoute></PrivateRoute>} />
        <Route path="/provider/waiting" element={<PrivateRoute><RoleRoute role="ServiceProvider"><AppLayout><ProviderWaiting /></AppLayout></RoleRoute></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
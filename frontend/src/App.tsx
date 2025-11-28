import type { JSX } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { isAuthenticated, getRoles } from './services/auth'
import AppLayout from './components/AppLayout'

import Login from './pages/Login'
import Register from './pages/Register'
//admin
import Admin from './pages/admin/AdminDashboard'
import Departments from './pages/admin/AdminDepartments'
import Roles from './pages/admin/AdminRoles'
//operator
import OperatorHome from './pages/operator/OperatorAppointments'
import OperatorWalkIn from './pages/operator/OperatorWalkIn'
//provider
import Provider from './pages/provider/ProviderParameters'
import ProviderAppointments from './pages/provider/ProviderAppointments'
import ProviderSessions from './pages/provider/ProviderSessions'
import ProviderWaiting from './pages/provider/ProviderWaiting'
//user
import UserAppointments from './pages/user/UserAppointments'
import UserHome from './pages/user/UserHome'
import ProfilePage from './pages/user/UserProfile'
import OperatorDashboard from './pages/operator/OperatorDashboard'

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
        
        <Route path="/admin" element={<PrivateRoute><RoleRoute role="Admin"><AppLayout><Admin /></AppLayout></RoleRoute></PrivateRoute>} />
        <Route path="/admin/departments" element={<PrivateRoute><RoleRoute role="Admin"><AppLayout><Departments /></AppLayout></RoleRoute></PrivateRoute>} />
        <Route path="/admin/departments/branches" element={<PrivateRoute><RoleRoute role="Admin"><AppLayout><Departments /></AppLayout></RoleRoute></PrivateRoute>} />
        <Route path="/admin/roles" element={<PrivateRoute><RoleRoute role="Admin"><AppLayout><Roles /></AppLayout></RoleRoute></PrivateRoute>} />
        <Route path="/admin/roles/assign-provider" element={<PrivateRoute><RoleRoute role="Admin"><AppLayout><Roles /></AppLayout></RoleRoute></PrivateRoute>} />
        <Route path="/admin/roles/assign-operator" element={<PrivateRoute><RoleRoute role="Admin"><AppLayout><Roles /></AppLayout></RoleRoute></PrivateRoute>} />
        <Route path="/admin/roles/user-operations" element={<PrivateRoute><RoleRoute role="Admin"><AppLayout><Roles /></AppLayout></RoleRoute></PrivateRoute>} />
        
        <Route path="/operator" element={<PrivateRoute><RoleRoute role="Operator"><AppLayout><OperatorHome /></AppLayout></RoleRoute></PrivateRoute>} />
        <Route path="/operator/dashboard" element={<PrivateRoute><RoleRoute role="Operator"><AppLayout><OperatorDashboard /></AppLayout></RoleRoute></PrivateRoute>} />
        <Route path="/operator/appointments" element={<PrivateRoute><RoleRoute role="Operator"><AppLayout><OperatorHome /></AppLayout></RoleRoute></PrivateRoute>} />
        <Route path="/operator/appointments/create" element={<PrivateRoute><RoleRoute role="Operator"><AppLayout><OperatorHome /></AppLayout></RoleRoute></PrivateRoute>} />
        <Route path="/operator/walk-in" element={<PrivateRoute><RoleRoute role="Operator"><AppLayout><OperatorWalkIn /></AppLayout></RoleRoute></PrivateRoute>} />
        
        <Route path="/provider" element={<PrivateRoute><RoleRoute role="ServiceProvider"><AppLayout><Provider /></AppLayout></RoleRoute></PrivateRoute>} />
        <Route path="/provider/appointments" element={<PrivateRoute><RoleRoute role="ServiceProvider"><AppLayout><ProviderAppointments /></AppLayout></RoleRoute></PrivateRoute>} />
        <Route path="/provider/waiting" element={<PrivateRoute><RoleRoute role="ServiceProvider"><AppLayout><ProviderWaiting /></AppLayout></RoleRoute></PrivateRoute>} />
        <Route path="/provider/sessions" element={<PrivateRoute><RoleRoute role="ServiceProvider"><AppLayout><ProviderSessions /></AppLayout></RoleRoute></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
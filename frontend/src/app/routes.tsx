import { createBrowserRouter, Navigate } from 'react-router';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Pacientes } from './pages/Pacientes';
import { PerfilPaciente } from './pages/PerfilPaciente';
import { NovoPaciente } from './pages/NovoPaciente';
import { EditarPaciente } from './pages/EditarPaciente';
import { TriagemPasso1 } from './pages/TriagemPasso1';
import { TriagemPasso2 } from './pages/TriagemPasso2';
import { TriagemResultado } from './pages/TriagemResultado';
import { DetalheTriagem } from './pages/DetalheTriagem';
import { Agenda } from './pages/Agenda';
import { Encaminhamentos } from './pages/Encaminhamentos';
import { Alertas } from './pages/Alertas';
import { Perfil } from './pages/Perfil';
import { Usuarios } from './pages/Usuarios';
import { NovoUsuario } from './pages/NovoUsuario';
import { EditarUsuario } from './pages/EditarUsuario';
import { ResponsiveLayout } from './components/ResponsiveLayout';
import { RequireAuth } from './components/RequireAuth';

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <ResponsiveLayout>{children}</ResponsiveLayout>
    </RequireAuth>
  );
}

function GestorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth perfis={['gestor']}>
      <ResponsiveLayout>{children}</ResponsiveLayout>
    </RequireAuth>
  );
}

function GestorCoordenadorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth perfis={['gestor', 'coordenador']}>
      <ResponsiveLayout>{children}</ResponsiveLayout>
    </RequireAuth>
  );
}

export const router = createBrowserRouter([
  // Rotas públicas
  {
    path: '/',
    element: <ResponsiveLayout showNav={false}><Login /></ResponsiveLayout>
  },
  {
    path: '/login',
    element: <ResponsiveLayout showNav={false}><Login /></ResponsiveLayout>
  },

  // Rotas autenticadas — todos os perfis
  { path: '/dashboard',                    element: <AuthLayout><Dashboard /></AuthLayout> },
  { path: '/pacientes',                    element: <AuthLayout><Pacientes /></AuthLayout> },
  { path: '/paciente/:id',                 element: <AuthLayout><PerfilPaciente /></AuthLayout> },
  { path: '/novo-paciente',               element: <AuthLayout><NovoPaciente /></AuthLayout> },
  { path: '/paciente/:id/editar',          element: <AuthLayout><EditarPaciente /></AuthLayout> },
  { path: '/triagem/:pacienteId/passo1',   element: <AuthLayout><TriagemPasso1 /></AuthLayout> },
  { path: '/triagem/:pacienteId/passo2',   element: <AuthLayout><TriagemPasso2 /></AuthLayout> },
  { path: '/triagem/:pacienteId/resultado',element: <AuthLayout><TriagemResultado /></AuthLayout> },
  { path: '/triagem/:id/detalhe',          element: <AuthLayout><DetalheTriagem /></AuthLayout> },
  { path: '/agenda',                       element: <AuthLayout><Agenda /></AuthLayout> },
  { path: '/encaminhamentos',              element: <AuthLayout><Encaminhamentos /></AuthLayout> },
  { path: '/alertas',                      element: <AuthLayout><Alertas /></AuthLayout> },
  { path: '/perfil',                       element: <AuthLayout><Perfil /></AuthLayout> },

  // Rotas exclusivas de gestor e coordenador
  { path: '/usuarios',     element: <GestorCoordenadorLayout><Usuarios /></GestorCoordenadorLayout> },
  { path: '/novo-usuario', element: <GestorLayout><NovoUsuario /></GestorLayout> },
  { path: '/usuario/:id',  element: <GestorCoordenadorLayout><EditarUsuario /></GestorCoordenadorLayout> },

  // Catch-all
  { path: '*', element: <Navigate to="/" replace /> }
]);

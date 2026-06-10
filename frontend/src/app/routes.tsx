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

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ResponsiveLayout showNav={false}>
        <Login />
      </ResponsiveLayout>
    )
  },
  {
    path: '/login',
    element: (
      <ResponsiveLayout showNav={false}>
        <Login />
      </ResponsiveLayout>
    )
  },
  {
    path: '/dashboard',
    element: (
      <ResponsiveLayout>
        <Dashboard />
      </ResponsiveLayout>
    )
  },
  {
    path: '/pacientes',
    element: (
      <ResponsiveLayout>
        <Pacientes />
      </ResponsiveLayout>
    )
  },
  {
    path: '/paciente/:id',
    element: (
      <ResponsiveLayout>
        <PerfilPaciente />
      </ResponsiveLayout>
    )
  },
  {
    path: '/novo-paciente',
    element: (
      <ResponsiveLayout>
        <NovoPaciente />
      </ResponsiveLayout>
    )
  },
  {
    path: '/paciente/:id/editar',
    element: (
      <ResponsiveLayout>
        <EditarPaciente />
      </ResponsiveLayout>
    )
  },
  {
    path: '/triagem/:pacienteId/passo1',
    element: (
      <ResponsiveLayout>
        <TriagemPasso1 />
      </ResponsiveLayout>
    )
  },
  {
    path: '/triagem/:pacienteId/passo2',
    element: (
      <ResponsiveLayout>
        <TriagemPasso2 />
      </ResponsiveLayout>
    )
  },
  {
    path: '/triagem/:pacienteId/resultado',
    element: (
      <ResponsiveLayout>
        <TriagemResultado />
      </ResponsiveLayout>
    )
  },
  {
    path: '/triagem/:id/detalhe',
    element: (
      <ResponsiveLayout>
        <DetalheTriagem />
      </ResponsiveLayout>
    )
  },
  {
    path: '/agenda',
    element: (
      <ResponsiveLayout>
        <Agenda />
      </ResponsiveLayout>
    )
  },
  {
    path: '/encaminhamentos',
    element: (
      <ResponsiveLayout>
        <Encaminhamentos />
      </ResponsiveLayout>
    )
  },
  {
    path: '/alertas',
    element: (
      <ResponsiveLayout>
        <Alertas />
      </ResponsiveLayout>
    )
  },
  {
    path: '/perfil',
    element: (
      <ResponsiveLayout>
        <Perfil />
      </ResponsiveLayout>
    )
  },
  {
    path: '/usuarios',
    element: (
      <ResponsiveLayout>
        <Usuarios />
      </ResponsiveLayout>
    )
  },
  {
    path: '/novo-usuario',
    element: (
      <ResponsiveLayout>
        <NovoUsuario />
      </ResponsiveLayout>
    )
  },
  {
    path: '/usuario/:id',
    element: (
      <ResponsiveLayout>
        <EditarUsuario />
      </ResponsiveLayout>
    )
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

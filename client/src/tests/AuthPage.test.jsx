import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';
import { AppRoutes } from '../App.jsx';
import AppLayout from '../layout/AppLayout.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';

const authMocks = vi.hoisted(() => ({
  me: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('../services/index.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    authService: {
      me: authMocks.me,
      login: authMocks.login,
      register: authMocks.register,
      logout: authMocks.logout,
    },
  };
});

function renderAuthPage(path, page, locationState) {
  return render(
    <MemoryRouter initialEntries={[locationState ? { pathname: path, state: locationState } : path]}>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={page === 'login' ? <Login /> : <Register />} />
            <Route path="/register" element={page === 'register' ? <Register /> : <Login />} />
            <Route path="/album/catalog/:externalId" element={<h1>Album</h1>} />
            <Route path="/" element={<h1>Dashboard</h1>} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  authMocks.me.mockResolvedValue({ user: null });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Login page', () => {
  it('renders labeled fields and submits credentials through authentication state', async () => {
    const user = userEvent.setup();
    authMocks.login.mockResolvedValue({ user: { id: 'user-1', username: 'listener' } });
    renderAuthPage('/login', 'login');

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Email'), 'listener@example.com');
    await user.type(screen.getByLabelText('Password'), 'secure-password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(authMocks.login).toHaveBeenCalledWith({
      email: 'listener@example.com',
      password: 'secure-password',
    }));
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('reports authentication failures without exposing the password', async () => {
    const user = userEvent.setup();
    authMocks.login.mockRejectedValue(new Error('Email or password is incorrect.'));
    renderAuthPage('/login', 'login');

    await user.type(screen.getByLabelText('Email'), 'listener@example.com');
    await user.type(screen.getByLabelText('Password'), 'incorrect-secret');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Email or password is incorrect.');
    expect(screen.queryByText('incorrect-secret')).not.toBeInTheDocument();
  });

  it('validates email, supports password visibility, and blocks repeated login submissions', async () => {
    const user = userEvent.setup();
    let finishLogin;
    authMocks.login.mockReturnValueOnce(new Promise((resolve) => { finishLogin = resolve; }));
    renderAuthPage('/login', 'login');

    await user.type(screen.getByLabelText('Email'), 'listener@example.com');
    const password = screen.getByLabelText('Password');
    await user.type(password, 'secure-password');
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show' }));
    expect(password).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Hide' }));
    expect(password).toHaveAttribute('type', 'password');

    const submit = screen.getByRole('button', { name: 'Log in' });
    await user.click(submit);
    expect(submit).toBeDisabled();
    await user.click(submit);
    expect(authMocks.login).toHaveBeenCalledOnce();

    finishLogin({ user: { id: 'user-1', username: 'listener' } });
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('returns to the intended internal page after login without accepting external redirects', async () => {
    const user = userEvent.setup();
    authMocks.login.mockResolvedValue({ user: { id: 'user-1', username: 'listener' } });
    renderAuthPage('/login', 'login', { from: '/album/catalog/594061854' });

    await user.type(screen.getByLabelText('Email'), 'listener@example.com');
    await user.type(screen.getByLabelText('Password'), 'secure-password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('heading', { name: 'Album' })).toBeInTheDocument();
  });

  it('rejects malformed email in the browser before submitting', async () => {
    const user = userEvent.setup();
    renderAuthPage('/login', 'login');
    const form = screen.getByRole('button', { name: 'Log in' }).closest('form');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'secure-password');
    expect(form.checkValidity()).toBe(false);
    expect(authMocks.login).not.toHaveBeenCalled();
  });
});

describe('Register page', () => {
  it('creates an account and follows the dashboard redirect', async () => {
    const user = userEvent.setup();
    authMocks.register.mockResolvedValue({ user: { id: 'user-2', username: 'new-listener' } });
    renderAuthPage('/register', 'register');

    await user.type(screen.getByLabelText('Username'), 'new-listener');
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'secure-password');
    await user.type(screen.getByLabelText('Confirm password'), 'secure-password');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(authMocks.register).toHaveBeenCalledWith({
      username: 'new-listener',
      email: 'new@example.com',
      password: 'secure-password',
    }));
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('rejects mismatched passwords before making a request', async () => {
    const user = userEvent.setup();
    renderAuthPage('/register', 'register');

    await user.type(screen.getByLabelText('Username'), 'new-listener');
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'secure-password');
    await user.type(screen.getByLabelText('Confirm password'), 'different-password');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Passwords do not match.');
    expect(authMocks.register).not.toHaveBeenCalled();
  });

  it('blocks repeated account creation while registration is pending', async () => {
    const user = userEvent.setup();
    let finishRegistration;
    authMocks.register.mockReturnValueOnce(new Promise((resolve) => { finishRegistration = resolve; }));
    renderAuthPage('/register', 'register');

    await user.type(screen.getByLabelText('Username'), 'new-listener');
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'secure-password');
    await user.type(screen.getByLabelText('Confirm password'), 'secure-password');
    const submit = screen.getByRole('button', { name: 'Create account' });
    await user.click(submit);
    expect(submit).toBeDisabled();
    await user.click(submit);
    expect(authMocks.register).toHaveBeenCalledOnce();

    finishRegistration({ user: { id: 'user-2', username: 'new-listener' } });
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });
});

it('redirects signed-out visitors from protected pages to login', async () => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  render(
    <MemoryRouter initialEntries={['/collections']}>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
  expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
});

it('preserves the intended protected page through login in the application routes', async () => {
  const user = userEvent.setup();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  authMocks.login.mockResolvedValue({ user: { id: 'user-1', username: 'listener' } });
  render(
    <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/community' } }]}>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );

  await user.type(await screen.findByLabelText('Email'), 'listener@example.com');
  await user.type(screen.getByLabelText('Password'), 'secure-password');
  await user.click(screen.getByRole('button', { name: 'Log in' }));

  expect(await screen.findByRole('heading', { name: 'Community' })).toBeInTheDocument();
});

it('logs the signed-in user out and restores guest navigation', async () => {
  const user = userEvent.setup();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  authMocks.me.mockResolvedValue({ user: { id: 'user-1', username: 'listener' } });
  authMocks.logout.mockResolvedValue(null);
  render(
    <MemoryRouter initialEntries={['/']}>
      <ToastProvider>
        <AuthProvider>
          <AppLayout />
          <Routes>
            <Route path="/login" element={<h1>Log in</h1>} />
            <Route path="/" element={<h1>Dashboard</h1>} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );

  await user.click((await screen.findAllByRole('button', { name: 'Log out' }))[0]);
  await waitFor(() => expect(authMocks.logout).toHaveBeenCalledOnce());
  expect(await screen.findAllByRole('link', { name: 'Log in' })).toHaveLength(2);
  expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
});

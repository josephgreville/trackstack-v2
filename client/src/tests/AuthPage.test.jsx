import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AuthProvider from '../context/AuthContext.jsx';
import Login from '../pages/Login.jsx';

describe('Login page', () => {
  beforeEach(() => {
    // Clear any existing auth state
    localStorage.removeItem('ts.sid');
  });

  it('should show login form', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>,
    );

    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /password/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('should submit login form', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>,
    );

    await userEvent.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
    await userEvent.type(screen.getByRole('textbox', { name: /password/i }), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    // Would need actual API call to verify login
    // For now just verify no errors
  });
});
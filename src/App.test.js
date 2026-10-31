import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  window.history.replaceState({}, '', '/');
});

test('renders the IEQ Cachoeira dashboard and fixed navigation', () => {
  render(<App />);
  expect(screen.getByText('IEQ Cachoeira')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /olá, pastor carlos/i })).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /triagem social/i })).toHaveAttribute('href', '/triagem');
});

test('navigates to members without reloading the application', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('link', { name: /membros/i }));
  expect(screen.getByRole('heading', { name: /membros da comunidade/i })).toBeInTheDocument();
});

test('shows the confidentiality notice on social triage', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('link', { name: /triagem social/i }));
  expect(screen.getByRole('heading', { name: /triagem social/i })).toBeInTheDocument();
  expect(screen.getByText(/confidencialidade e lgpd/i)).toBeInTheDocument();
});

test('switches between courses and job listings', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('link', { name: /empregabilidade/i }));
  expect(screen.getByRole('heading', { name: /empregabilidade e cursos/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: /vagas de emprego/i }));
  expect(screen.getByRole('heading', { name: /atendente de loja/i })).toBeInTheDocument();
});

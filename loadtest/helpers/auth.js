import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from './config.js';

export function login(email, password) {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(res, {
    'login successful': (r) => r.status === 200 || r.status === 201,
    'login returns accessToken': (r) => !!r.json().accessToken,
  });

  return res.json().accessToken;
}

export function authHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}

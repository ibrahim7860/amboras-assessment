// NOTE: Run the event simulator (`npm run simulate` in backend/) alongside this
// test for realistic write pressure. The writers scenario below simulates auth
// load; actual event writes come from the simulator.

import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { login, authHeaders } from '../helpers/auth.js';
import { BASE_URL, TEST_ACCOUNTS, PERIODS } from '../helpers/config.js';

export const options = {
  scenarios: {
    readers: {
      executor: 'constant-vus',
      vus: 30,
      duration: '2m',
      exec: 'readAnalytics',
    },
    writers: {
      executor: 'constant-vus',
      vus: 20,
      duration: '2m',
      exec: 'writeLoad',
    },
  },
  thresholds: {
    'group_duration{group:::readAnalytics}': ['p(95)<500'],
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.02'],
  },
};

export function setup() {
  const tokens = TEST_ACCOUNTS.map((account) =>
    login(account.email, account.password),
  );
  return { tokens };
}

export function readAnalytics(data) {
  const token = data.tokens[Math.floor(Math.random() * data.tokens.length)];
  const params = authHeaders(token);
  const period = PERIODS[Math.floor(Math.random() * PERIODS.length)];

  group('readAnalytics', () => {
    const overviewRes = http.get(
      `${BASE_URL}/api/v1/analytics/overview?period=${period}`,
      params,
    );
    check(overviewRes, {
      'overview status 200': (r) => r.status === 200,
    });

    const topRes = http.get(
      `${BASE_URL}/api/v1/analytics/top-products?period=${period}`,
      params,
    );
    check(topRes, {
      'top-products status 200': (r) => r.status === 200,
    });

    const activityRes = http.get(
      `${BASE_URL}/api/v1/analytics/recent-activity?limit=20`,
      params,
    );
    check(activityRes, {
      'recent-activity status 200': (r) => r.status === 200,
    });
  });

  sleep(1);
}

export function writeLoad(data) {
  const account = TEST_ACCOUNTS[Math.floor(Math.random() * TEST_ACCOUNTS.length)];

  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: account.email, password: account.password }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(res, {
    'login successful': (r) => r.status === 200 || r.status === 201,
  });

  sleep(0.5);
}

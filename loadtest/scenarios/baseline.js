import { group, check, sleep } from 'k6';
import http from 'k6/http';
import { login, authHeaders } from '../helpers/auth.js';
import { BASE_URL, TEST_ACCOUNTS, PERIODS } from '../helpers/config.js';

export const options = {
  scenarios: {
    baseline: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  const account = TEST_ACCOUNTS[0];
  const token = login(account.email, account.password);
  return { token };
}

export default function (data) {
  const params = authHeaders(data.token);
  const period = PERIODS[Math.floor(Math.random() * PERIODS.length)];

  group('overview', () => {
    const res = http.get(
      `${BASE_URL}/api/v1/analytics/overview?period=${period}`,
      params,
    );
    check(res, {
      'overview status 200': (r) => r.status === 200,
      'overview has revenue': (r) => r.json().revenue !== undefined,
    });
  });

  group('top-products', () => {
    const res = http.get(
      `${BASE_URL}/api/v1/analytics/top-products?period=today`,
      params,
    );
    check(res, {
      'top-products status 200': (r) => r.status === 200,
      'top-products is array': (r) => Array.isArray(r.json()),
    });
  });

  group('recent-activity', () => {
    const res = http.get(
      `${BASE_URL}/api/v1/analytics/recent-activity?limit=20`,
      params,
    );
    check(res, {
      'recent-activity status 200': (r) => r.status === 200,
      'recent-activity is array': (r) => Array.isArray(r.json()),
    });
  });

  sleep(1);
}

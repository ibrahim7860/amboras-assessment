import { check, sleep } from 'k6';
import http from 'k6/http';
import { login, authHeaders } from '../helpers/auth.js';
import { BASE_URL, TEST_ACCOUNTS, PERIODS } from '../helpers/config.js';

export const options = {
  scenarios: {
    storeOne: {
      executor: 'constant-vus',
      vus: 50,
      duration: '1m',
      exec: 'storeOne',
    },
    storeTwo: {
      executor: 'constant-vus',
      vus: 50,
      duration: '1m',
      exec: 'storeTwo',
    },
    storeThree: {
      executor: 'constant-vus',
      vus: 50,
      duration: '1m',
      exec: 'storeThree',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  const tokens = TEST_ACCOUNTS.map((account) =>
    login(account.email, account.password),
  );
  return { tokens };
}

function queryStore(token, storeId) {
  const params = authHeaders(token);
  const period = PERIODS[Math.floor(Math.random() * PERIODS.length)];

  const overviewRes = http.get(
    `${BASE_URL}/api/v1/analytics/overview?period=${period}`,
    params,
  );
  check(overviewRes, {
    [`${storeId} overview status 200`]: (r) => r.status === 200,
    [`${storeId} overview has valid JSON`]: (r) => {
      const body = r.json();
      return body !== null && typeof body === 'object' && body.revenue !== undefined;
    },
  });

  const topRes = http.get(
    `${BASE_URL}/api/v1/analytics/top-products?period=${period}`,
    params,
  );
  check(topRes, {
    [`${storeId} top-products status 200`]: (r) => r.status === 200,
    [`${storeId} top-products is array`]: (r) => Array.isArray(r.json()),
  });

  const activityRes = http.get(
    `${BASE_URL}/api/v1/analytics/recent-activity?limit=20`,
    params,
  );
  check(activityRes, {
    [`${storeId} recent-activity status 200`]: (r) => r.status === 200,
    [`${storeId} recent-activity is array`]: (r) => Array.isArray(r.json()),
  });

  sleep(1);
}

export function storeOne(data) {
  queryStore(data.tokens[0], 'store_001');
}

export function storeTwo(data) {
  queryStore(data.tokens[1], 'store_002');
}

export function storeThree(data) {
  queryStore(data.tokens[2], 'store_003');
}

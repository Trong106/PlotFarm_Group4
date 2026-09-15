const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the real store with controlled API responses, without a live database.
const source = fs.readFileSync(path.join(__dirname, '../src/store/useAuthStore.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText;
const user = { userId: 7, fullName: 'Profile Test', email: 'profile@example.com', role: 'Customer' };
const flush = () => new Promise((resolve) => setImmediate(resolve));

function setup(get) {
  const values = new Map([['token', 'test-session'], ['user', JSON.stringify(user)]]);
  const localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const calls = [];
  const api = { get: (...args) => { calls.push(args[0]); return get(...args); } };
  const exports = {};
  const document = { cookie: 'token=test-session' };
  vm.runInNewContext(compiled, {
    exports, window: {}, localStorage, document,
    require: (id) => {
      if (id === '@/lib/axios') return api;
      if (id === '@/store/useToastStore') return { toast: { info() {}, success() {}, error() {} } };
      return require(id);
    },
  });
  return { store: exports.useAuthStore, calls, localStorage, document };
}

test('repeated mounts and concurrent profile loads finish with one API request', async () => {
  let resolve;
  const { store, calls } = setup(() => new Promise((done) => { resolve = done; }));
  store.getState().initAuth();
  store.getState().initAuth();
  await store.getState().fetchProfile();
  assert.equal(store.getState().isLoading, true);
  assert.equal(calls.length, 1);
  resolve({ data: { data: user } });
  await flush();
  assert.equal(store.getState().isLoading, false);
  // Header mounts again when the loading screen disappears.
  store.getState().initAuth();
  await flush();
  assert.equal(calls.length, 1);
  assert.equal(store.getState().isAuthenticated, true);
});

for (const status of [401, 403]) {
  test(`HTTP ${status} ends loading and clears the session without fallback requests`, async () => {
    const { store, calls, localStorage, document } = setup(async () => {
      throw { response: { status } };
    });
    store.getState().initAuth();
    await flush();
    assert.equal(store.getState().isLoading, false);
    assert.equal(store.getState().isAuthenticated, false);
    assert.equal(store.getState().token, null);
    assert.equal(localStorage.getItem('token'), null);
    assert.match(document.cookie, /expires=Thu, 01 Jan 1970/);
    assert.deepEqual(calls, ['/users/me']);
  });
}

test('network failure keeps the cached profile, ends loading and allows retry', async () => {
  let offline = true;
  const { store, calls } = setup(async () => {
    if (offline) throw new Error('timeout');
    return { data: { data: { ...user, fullName: 'Updated Name' } } };
  });
  store.getState().initAuth();
  await flush();
  assert.equal(store.getState().isLoading, false);
  assert.equal(store.getState().isAuthenticated, true);
  assert.equal(store.getState().user.fullName, user.fullName);
  assert.ok(store.getState().error);
  store.getState().initAuth();
  assert.equal(calls.length, 1);
  offline = false;
  await store.getState().fetchProfile();
  assert.equal(store.getState().user.fullName, 'Updated Name');
  assert.equal(store.getState().error, null);
});

test('a late profile response cannot sign a logged-out user back in', async () => {
  let resolve;
  const { store, localStorage } = setup(() => new Promise((done) => { resolve = done; }));
  store.getState().initAuth();
  store.getState().logout();
  resolve({ data: { data: user } });
  await flush();
  assert.equal(store.getState().user, null);
  assert.equal(store.getState().isAuthenticated, false);
  assert.equal(store.getState().isLoading, false);
  assert.equal(localStorage.getItem('user'), null);
});

test('older backends can still use auth/me when users/me returns 404', async () => {
  const { store, calls } = setup(async (url) => {
    if (url === '/users/me') throw { response: { status: 404 } };
    return { data: { data: user } };
  });
  store.getState().initAuth();
  await flush();
  assert.deepEqual(calls, ['/users/me', '/auth/me']);
  assert.equal(store.getState().isLoading, false);
  assert.equal(store.getState().user.fullName, user.fullName);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createAccounts, TTL } = require('../game/accounts');

function fixture(t) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'loc-accounts-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const file = path.join(dir, 'accounts.json');
    let time = 100000;
    return { file, accounts: createAccounts(file, () => time), advance: n => { time += n; } };
}
test('accounts: registration, case-insensitive login, persistence, owner and logout', async t => {
    const { file, accounts: a } = fixture(t);
    const [owner, other] = await Promise.all([a.register('Owner', 'secret123'), a.register('Other', 'secret123')]);
    assert.deepEqual(owner.user, { name: 'Owner', admin: true });
    assert.equal(other.user.admin, false);
    assert.match(owner.token, /^[a-f0-9]{64}$/);
    assert.equal((await a.register('OWNER', 'secret123')).ok, false);
    const logged = await a.login('OWNER', 'secret123');
    assert.equal(logged.ok, true);
    assert.deepEqual(a.resume(logged.token), logged);
    const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(stored.users.owner.salt.length, 32);
    assert.equal(stored.users.owner.hash.length, 128);
    assert.ok(!fs.readFileSync(file, 'utf8').includes('secret123'));
    const reopened = createAccounts(file, () => 100000);
    assert.equal(reopened.resume(owner.token).ok, true);
    assert.deepEqual(reopened.logout(owner.token), { ok: true, user: null });
    assert.equal(createAccounts(file).resume(owner.token).ok, false);
});
test('accounts: five failures lock for sixty seconds and tokens expire after thirty days', async t => {
    const { accounts: a, advance } = fixture(t);
    const r = await a.register('Owner', 'secret123');
    for (let i = 0; i < 5; i++) assert.equal((await a.login('OWNER', 'wrongpass')).ok, false);
    assert.match((await a.login('owner', 'secret123')).error, /1 phút/);
    advance(60000);
    assert.equal((await a.login('owner', 'secret123')).ok, true);
    advance(TTL);
    assert.equal(a.resume(r.token).ok, false);
    assert.equal(a.resume('__proto__').ok, false);
});
test('accounts: username/password boundaries and prototype-like names', async t => {
    const { accounts: a } = fixture(t);
    for (const user of ['', 'ab', 'a'.repeat(21), 'a b', 'a-b', 'tên', null]) assert.equal((await a.register(user, 'secret123')).ok, false);
    for (const pass of ['', '12345', 'x'.repeat(65), null]) assert.equal((await a.register('valid', pass)).ok, false);
    assert.equal((await a.register('A_1', '123456')).ok, true);
    assert.equal((await a.register('a'.repeat(20), 'x'.repeat(64))).ok, true);
    assert.equal((await a.register('__proto__', 'secret123')).ok, true);
    assert.equal((await a.login('__PROTO__', 'secret123')).ok, true);
});

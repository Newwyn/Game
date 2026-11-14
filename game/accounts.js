const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(crypto.scrypt);
const TTL = 30 * 86400000;
const fail = error => ({ ok: false, error });

function createAccounts(file = path.join(process.env.LOC_DATA_DIR || path.join(__dirname, '..', 'data'), 'accounts.json'), now = Date.now) {
    let db;
    try { db = JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch (e) { if (e.code !== 'ENOENT') throw e; db = { users: {}, tokens: {} }; }
    db.users = Object.assign(Object.create(null), db.users);
    db.tokens = Object.assign(Object.create(null), db.tokens);
    const attempts = new Map();
    const own = (obj, key) => Object.hasOwn(obj, key);
    const save = () => {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        const temp = `${file}.tmp`;
        fs.writeFileSync(temp, JSON.stringify(db), { mode: 0o600 });
        fs.renameSync(temp, file);
    };
    const publicUser = key => ({ name: db.users[key].name, admin: db.users[key].admin });
    const issue = key => {
        const token = crypto.randomBytes(32).toString('hex');
        db.tokens[token] = { key, expires: now() + TTL };
        save();
        return { ok: true, user: publicUser(key), token };
    };
    // Serialize async password operations so simultaneous first registrations cannot both become owner.
    let queue = Promise.resolve();
    const serial = fn => (...args) => { const result = queue.then(() => fn(...args)); queue = result.catch(() => {}); return result; };
    return {
        register: serial(async (user, pass) => {
            if (typeof user !== 'string' || !/^[A-Za-z0-9_]{3,20}$/.test(user)) return fail('Tên đăng nhập 3–20 ký tự (chữ, số, _)');
            if (typeof pass !== 'string' || pass.length < 6 || pass.length > 64) return fail('Mật khẩu từ 6 đến 64 ký tự');
            const key = user.toLowerCase();
            if (own(db.users, key)) return fail('Tên này đã có người dùng');
            const salt = crypto.randomBytes(16).toString('hex');
            const hash = (await scrypt(pass, Buffer.from(salt, 'hex'), 64)).toString('hex');
            db.users[key] = { name: user, salt, hash, admin: Object.keys(db.users).length === 0 };
            return issue(key);
        }),
        login: serial(async (user, pass) => {
            const key = typeof user === 'string' ? user.toLowerCase() : '';
            if (!/^[a-z0-9_]{3,20}$/.test(key)) return fail('Sai tên đăng nhập hoặc mật khẩu');
            const a = attempts.get(key) ?? { count: 0, until: 0 };
            if (a.until > now()) return fail('Thử sai nhiều lần — đợi 1 phút');
            if (a.until) { a.count = 0; a.until = 0; }
            const u = own(db.users, key) ? db.users[key] : null;
            const validPass = typeof pass === 'string' && pass.length >= 6 && pass.length <= 64;
            const hash = await scrypt(validPass ? pass : '', Buffer.from(u?.salt ?? '00'.repeat(16), 'hex'), 64);
            if (!u || !validPass || !crypto.timingSafeEqual(hash, Buffer.from(u.hash, 'hex'))) {
                if (++a.count >= 5) a.until = now() + 60000;
                attempts.set(key, a);
                return fail(a.until ? 'Thử sai nhiều lần — đợi 1 phút' : 'Sai tên đăng nhập hoặc mật khẩu');
            }
            attempts.delete(key);
            return issue(key);
        }),
        resume(token) {
            if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || !own(db.tokens, token)) return fail('Phiên đăng nhập đã hết hạn');
            const t = db.tokens[token];
            if (t.expires <= now() || !own(db.users, t.key)) { delete db.tokens[token]; save(); return fail('Phiên đăng nhập đã hết hạn'); }
            return { ok: true, user: publicUser(t.key), token };
        },
        logout(token) {
            if (typeof token === 'string' && own(db.tokens, token)) { delete db.tokens[token]; save(); }
            return { ok: true, user: null };
        },
    };
}
module.exports = { createAccounts, TTL };

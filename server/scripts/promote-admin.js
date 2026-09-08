// Usage: node scripts/promote-admin.js user@example.com
const db = require('../src/db');
const User = require('../src/models/User');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/promote-admin.js <email>');
  process.exit(1);
}

const user = User.findByEmail(email.toLowerCase());
if (!user) {
  console.error(`No user found with email ${email}`);
  process.exit(1);
}

User.setRole(user.id, 'admin');
console.log(`${email} promoted to admin.`);

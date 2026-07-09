const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('Kullanim: node scripts/hash-admin-password.js SIFREN');
  process.exit(1);
}

bcrypt.hash(password, 12).then((hash) => {
  console.log(hash);
});

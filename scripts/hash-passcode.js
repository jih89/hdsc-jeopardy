import crypto from 'crypto';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter passcode to hash: ', (passcode) => {
  const hash = crypto
    .createHash('sha256')
    .update(passcode)
    .digest('hex');
  
  console.log('\nPasscode hash (use this for ADMIN_PASSCODE_HASH):');
  console.log(hash);
  console.log('\nAdd this to your .env.local file:');
  console.log(`ADMIN_PASSCODE_HASH=${hash}\n`);
  
  rl.close();
});


import prisma from './db.js';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Masukkan username admin: ', (username) => {
  rl.question('Masukkan password admin: ', async (password) => {
    if (!username || !password) {
      console.error('Username dan password tidak boleh kosong.');
      rl.close();
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      await prisma.admin.create({
        data: {
          username: username,
          password: hashedPassword,
        },
      });
      console.log(`Sukses! Admin user '${username}' telah dibuat.`);
    } catch (e) {
      if (e.code === 'P2002') {
        console.error('Error: Username tersebut sudah ada.');
      } else {
        console.error('Error membuat admin:', e);
      }
    } finally {
      await prisma.$disconnect();
      rl.close();
    }
  });
});
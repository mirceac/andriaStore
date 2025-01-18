import { pbkdf2Sync } from "crypto";

// Hash password using the same method as auth.ts
const username = 'admin';
const password = 'admin123';
const hashedPassword = pbkdf2Sync(password, username, 1000, 64, 'sha512').toString('hex');

console.log('Use this hashed password in the SQL query:', hashedPassword);

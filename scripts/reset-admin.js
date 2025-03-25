// Script to reset admin password
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function main() {
  // Create connection
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });

  try {
    // Reset admin password in users table
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Update in users table
    await connection.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, 'admin@example.com']
    );
    console.log('Reset admin password in users table');
    
    // Also update in user table if it exists
    try {
      await connection.execute(
        'UPDATE `user` SET password = ? WHERE email = ?',
        [hashedPassword, 'admin@example.com']
      );
      console.log('Reset admin password in user table');
    } catch (err) {
      console.log('Could not update admin in user table:', err.message);
    }
    
    // Create a test user in users table
    try {
      const testPassword = await bcrypt.hash('password123', 10);
      
      // Check if test user exists first
      const [testUsers] = await connection.execute(
        'SELECT * FROM users WHERE email = ?',
        ['test123@example.com']
      );
      
      if (testUsers.length === 0) {
        await connection.execute(
          'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
          ['test123@example.com', testPassword, 'investor']
        );
        console.log('Created test user (test123@example.com) in users table');
      } else {
        await connection.execute(
          'UPDATE users SET password = ? WHERE email = ?',
          [testPassword, 'test123@example.com']
        );
        console.log('Updated test user password in users table');
      }
    } catch (err) {
      console.log('Error with test user:', err.message);
    }
    
    console.log('\nYou can now log in with:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('\nOr with:');
    console.log('Email: test123@example.com');
    console.log('Password: password123');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

main(); 
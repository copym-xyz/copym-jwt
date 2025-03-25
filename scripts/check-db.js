// Script to check the database
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
    // Check tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Tables in database:', tables.map(t => Object.values(t)[0]));

    // Check user table
    const [userRows] = await connection.execute('SHOW TABLES LIKE "user"');
    if (userRows.length > 0) {
      const [userCols] = await connection.execute('DESCRIBE `user`');
      console.log('User table columns:', userCols.map(col => ({ 
        Field: col.Field, 
        Type: col.Type,
        Default: col.Default
      })));
      
      // Check existing users in the User table
      const [users] = await connection.execute('SELECT * FROM `user`');
      console.log('Users in User table:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));

      // Create a test user in the User table if it doesn't exist
      if (!users.find(u => u.email === 'testuser@example.com')) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await connection.execute(
          'INSERT INTO `user` (email, password, role, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          ['testuser@example.com', hashedPassword, 'investor', 'Test User', now, now]
        );
        console.log('Created test user (testuser@example.com) in User table');
      }
    }

    // Check users table (view or table)
    const [usersTable] = await connection.execute('SHOW TABLES LIKE "users"');
    if (usersTable.length > 0) {
      try {
        const [usersCols] = await connection.execute('DESCRIBE users');
        console.log('Users table columns:', usersCols.map(col => ({ 
          Field: col.Field, 
          Type: col.Type,
          Default: col.Default
        })));
        
        // Check existing users in the users table/view
        const [users] = await connection.execute('SELECT * FROM users');
        console.log('Users in users table/view:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));
      } catch (error) {
        console.error('Error accessing users table/view:', error.message);
        
        // Create users view if it exists but has issues
        console.log('Recreating users view...');
        await connection.execute('DROP VIEW IF EXISTS users');
        await connection.execute(`
          CREATE VIEW users AS
          SELECT 
            id,
            email,
            password,
            IFNULL(role, 'investor') as role,
            NULL as refresh_token,
            created_at,
            updated_at
          FROM \`user\`
        `);
        console.log('Recreated users view');
        
        // Verify the view
        const [users] = await connection.execute('SELECT * FROM users');
        console.log('Users in recreated view:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));
      }
    } else {
      console.log('Users table/view not found, creating it...');
      await connection.execute(`
        CREATE VIEW users AS
        SELECT 
          id,
          email,
          password,
          IFNULL(role, 'investor') as role,
          NULL as refresh_token,
          created_at,
          updated_at
        FROM \`user\`
      `);
      console.log('Created users view');
    }

    // Create a test user through the view to test login
    try {
      const [testUser] = await connection.execute('SELECT * FROM users WHERE email = ?', ['logintest@example.com']);
      if (testUser.length === 0) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await connection.execute(
          'INSERT INTO `user` (email, password, role, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          ['logintest@example.com', hashedPassword, 'investor', 'Login Test', now, now]
        );
        console.log('Created login test user (logintest@example.com)');
        console.log('You can log in with:');
        console.log('Email: logintest@example.com');
        console.log('Password: password123');
      } else {
        console.log('Login test user already exists (logintest@example.com)');
        console.log('You can log in with:');
        console.log('Email: logintest@example.com');
        console.log('Password: password123');
      }
    } catch (error) {
      console.error('Error creating test login user:', error);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

main(); 
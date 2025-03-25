"use server";

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function executeQuery(query, params = []) {
  try {
    const [rows, fields] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

// Initialize the database with required tables
export async function initializeDatabase() {
  try {
    // Check if tables exist
    const checkTablesResult = await executeQuery("SHOW TABLES");
    const tables = checkTablesResult.map(t => Object.values(t)[0]);
    console.log('Tables in database:', tables);
    
    const userTableExists = tables.includes('user');
    const usersTableExists = tables.includes('users');
    
    console.log('Tables status: user exists:', userTableExists, 'users exists:', usersTableExists);
    
    // If neither table exists, create the users table
    if (!userTableExists && !usersTableExists) {
      console.log('Creating users table from scratch');
      
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255),
          role ENUM('admin', 'issuer', 'investor') NOT NULL DEFAULT 'investor',
          refresh_token VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);
      
      // Create issuer_invitations table
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS issuer_invitations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          token VARCHAR(255) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          used BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (created_by) REFERENCES users(id)
        );
      `);
    }
    
    // Seed an admin user if doesn't exist in users table
    if (usersTableExists) {
      const adminEmail = 'admin@example.com';
      const adminExists = await executeQuery('SELECT * FROM users WHERE email = ?', [adminEmail]);
      
      if (adminExists.length === 0) {
        // Hash password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await executeQuery(
          'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
          [adminEmail, hashedPassword, 'admin']
        );
        
        console.log('Admin user created in users table:', adminEmail);
      }
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
} 
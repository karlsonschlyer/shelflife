// Server/server.js
require('dotenv').config();
const db = require('./db');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');
const session = require('express-session');

const app = express();

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from client folder
app.use(express.static(path.join(__dirname, '../client')));

// Sessions
app.use(session({
  secret: 'super-secret-key', // change for production
  resave: false,
  saveUninitialized: true
}));

// === ROUTES ===

// Register a new user
app.post('/register', async (req, res) => {
  const { username, password, birthDate, firstName, lastName } = req.body;
  try {
    // Check if username already exists
    const [existing] = await pool.query(
      'SELECT username FROM User WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).send('Username already taken. Please choose another.');
    }

    // Insert new user
    await pool.query(
      'INSERT INTO User (username, password, birthDate, firstName, lastName) VALUES (?, ?, ?, ?, ?)',
      [username, password, birthDate, firstName, lastName]
    );

    console.log(`User registered: ${username}`);
    res.redirect('/login.html');
  } catch (err) {
    console.error(err);
    res.status(500).send(`Error registering user: ${err.message}`);
  }
});

// Login user
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM User WHERE username = ? AND password = ?',
      [username, password]
    );
    if (rows.length > 0) {
      req.session.username = username; // store username in session
      res.redirect('/index.html'); // back to homepage
    } else {
      res.status(401).send('Invalid username or password');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send(`Error logging in: ${err.message}`);
  }
});

// Get user info
app.get('/user/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT username, firstName, lastName, birthDate FROM User WHERE username = ?',
      [username]
    );
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send(`Error retrieving user: ${err.message}`);
  }
});

// Dashboard data
app.get('/dashboard-data', async (req, res) => {
  if (!req.session.username) {
    return res.status(401).json({ message: 'Not logged in' });
  }

  try {
    const [userRows] = await pool.query(
      'SELECT username, firstName, lastName, birthDate FROM User WHERE username = ?',
      [req.session.username]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRows[0];

    // Include ISBN so we can link to book details
    const [wantToRead] = await pool.query(
      `SELECT e.isbn, e.title
       FROM \`Reads\` r
       JOIN Edition e ON r.isbn = e.isbn
       WHERE r.username = ? AND r.willRead = 1`,
      [req.session.username]
    );

    const [reviews] = await pool.query(
      `SELECT e.isbn, e.title, rv.starRating, rv.reviewText
       FROM Reviews rv
       JOIN Edition e ON rv.isbn = e.isbn
       WHERE rv.username = ?`,
      [req.session.username]
    );

    res.json({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      birthDate: user.birthDate,
      wantToRead,
      reviews
    });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

// Browse books
app.get('/browse', (req, res) => {
  const {
    title,
    author,
    publisher,
    genre,
    minRating,
    minPages,
    maxPages,
    minDate,
    maxDate,
    page = 1,
    limit = 20
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  let baseQuery = `
    SELECT 
      e.isbn,
      e.title,
      GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') AS author,
      pubr.name AS publisher,
      e.genres,
      e.numPages,
      e.reviewAverage,
      pub.publishDate
    FROM Edition e
    LEFT JOIN Writes w ON e.isbn = w.isbn
    LEFT JOIN Author a ON w.authorID = a.authorID
    LEFT JOIN Publishes pub ON e.isbn = pub.isbn
    LEFT JOIN Publisher pubr ON pub.publisherID = pubr.publisherID
    WHERE 1=1
  `;

  const params = [];

  if (title) {
    baseQuery += ` AND e.title LIKE ?`;
    params.push(`%${title}%`);
  }
  if (author) {
    baseQuery += ` AND a.name LIKE ?`;
    params.push(`%${author}%`);
  }
  if (publisher) {
    baseQuery += ` AND pubr.name LIKE ?`;
    params.push(`%${publisher}%`);
  }
  if (genre) {
    baseQuery += ` AND e.genres LIKE ?`;
    params.push(`%${genre}%`);
  }
  if (minRating) {
    baseQuery += ` AND e.reviewAverage >= ?`;
    params.push(minRating);
  }
  if (minPages) {
    baseQuery += ` AND e.numPages >= ?`;
    params.push(minPages);
  }
  if (maxPages) {
    baseQuery += ` AND e.numPages <= ?`;
    params.push(maxPages);
  }
  if (minDate) {
    baseQuery += ` AND pub.publishDate >= ?`;
    params.push(minDate);
  }
  if (maxDate) {
    baseQuery += ` AND pub.publishDate <= ?`;
    params.push(maxDate);
  }

  const groupAndOrder = `
    GROUP BY e.isbn, e.title, pubr.name, e.genres, e.numPages, e.reviewAverage, pub.publishDate
    ORDER BY e.title
  `;

  // Count query for total results
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM (${baseQuery} ${groupAndOrder}) AS subquery
  `;

  // Main paginated query
  const paginatedQuery = `
    ${baseQuery} ${groupAndOrder}
    LIMIT ? OFFSET ?
  `;

  db.query(countQuery, params, (err, countResults) => {
    if (err) {
      console.error('Error counting browse data:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    const total = countResults[0].total;
    const totalPages = Math.ceil(total / limit);

    db.query(paginatedQuery, [...params, parseInt(limit), offset], (err, results) => {
      if (err) {
        console.error('Error fetching browse data:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json({
        page: parseInt(page),
        totalPages,
        totalResults: total,
        results
      });
    });
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Error logging out');
    }
    res.clearCookie('connect.sid');
    res.redirect('/index.html');
  });
});

// Get book details by ISBN (always compute average from Reviews)
app.get('/book/:isbn', async (req, res) => {
  try {
    const isbn = req.params.isbn;

    const [bookRows] = await pool.query(`
      SELECT 
        e.isbn,
        e.title,
        e.description,
        e.numPages,
        e.genres,
        AVG(r.starRating) AS reviewAverage,
        ANY_VALUE(pubr.name) AS publisher,
        ANY_VALUE(pub.publishDate) AS publishDate,
        GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') AS authors,
        GROUP_CONCAT(DISTINCT dtr.name SEPARATOR ', ') AS distributors
      FROM Edition e
      LEFT JOIN Reviews r ON e.isbn = r.isbn
      LEFT JOIN Writes w ON e.isbn = w.isbn
      LEFT JOIN Author a ON w.authorID = a.authorID
      LEFT JOIN Publishes pub ON e.isbn = pub.isbn
      LEFT JOIN Publisher pubr ON pub.publisherID = pubr.publisherID
      LEFT JOIN Distributes dist ON e.isbn = dist.isbn
      LEFT JOIN Distributor dtr ON dist.distributorID = dtr.distributorID
      WHERE e.isbn = ?
      GROUP BY e.isbn
    `, [isbn]);

    if (bookRows.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const [reviews] = await pool.query(`
      SELECT r.username, r.starRating, r.reviewText, r.reviewedAt
      FROM Reviews r
      WHERE r.isbn = ?
      ORDER BY r.reviewedAt DESC
    `, [isbn]);

    // ensure reviewAverage is a number (or null if no reviews)
    const book = bookRows[0];
    if (book.reviewAverage !== null) {
      book.reviewAverage = parseFloat(book.reviewAverage);
    }

    res.json({
      ...book,
      reviews
    });

  } catch (err) {
    console.error('Error fetching book details:', err);
    res.status(500).json({ message: 'Error fetching book details' });
  }
});

// Submit or update a review for a book (transactional, updates Edition.reviewAverage)
app.post('/book/:isbn/review', async (req, res) => {
  if (!req.session.username) {
    return res.status(401).json({ message: 'Not logged in' });
  }

  const { starRating, reviewText } = req.body;
  const isbn = req.params.isbn;
  const username = req.session.username;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check if review exists
    const [existing] = await conn.query(
      'SELECT * FROM Reviews WHERE isbn = ? AND username = ? FOR UPDATE',
      [isbn, username]
    );

    if (existing.length > 0) {
      // Update existing review
      await conn.query(
        'UPDATE Reviews SET starRating = ?, reviewText = ?, reviewedAt = NOW() WHERE isbn = ? AND username = ?',
        [starRating, reviewText, isbn, username]
      );
    } else {
      // Insert new review
      await conn.query(
        'INSERT INTO Reviews (username, isbn, starRating, reviewText, reviewedAt) VALUES (?, ?, ?, ?, NOW())',
        [username, isbn, starRating, reviewText]
      );
    }

    // Recalculate the average rating from Reviews
    const [avgRows] = await conn.query(
      'SELECT AVG(starRating) AS avgRating FROM Reviews WHERE isbn = ?',
      [isbn]
    );
    const newAvg = avgRows[0].avgRating !== null ? parseFloat(avgRows[0].avgRating) : null;

    // Update Edition table (store the up-to-date average for persistence)
    await conn.query(
      'UPDATE Edition SET reviewAverage = ? WHERE isbn = ?',
      [newAvg, isbn]
    );

    await conn.commit();
    res.json({ message: 'Review saved successfully', newAverage: newAvg });
  } catch (err) {
    await conn.rollback();
    console.error('Error saving review (transaction):', err);
    res.status(500).json({ message: 'Error saving review' });
  } finally {
    conn.release();
  }
});

app.post('/book/:isbn/want-to-read', async (req, res) => {
  if (!req.session.username) {
    return res.status(401).json({ message: 'Not logged in' });
  }

  const isbn = req.params.isbn;
  const username = req.session.username;

  try {
    // Check if the record already exists
    const [existing] = await pool.query(
      'SELECT * FROM `Reads` WHERE isbn = ? AND username = ?',
      [isbn, username]
    );

    if (existing.length > 0) {
      // Toggle: if already marked as want-to-read, remove it
      if (existing[0].willRead === 1) {
        await pool.query(
          'DELETE FROM `Reads` WHERE isbn = ? AND username = ?',
          [isbn, username]
        );
        return res.json({ message: 'Removed from Want to Read list' });
      } else {
        await pool.query(
          'UPDATE `Reads` SET willRead = 1 WHERE isbn = ? AND username = ?',
          [isbn, username]
        );
        return res.json({ message: 'Added to Want to Read list' });
      }
    } else {
      // Insert new record
      await pool.query(
        'INSERT INTO `Reads` (username, isbn, willRead) VALUES (?, ?, 1)',
        [username, isbn]
      );
      return res.json({ message: 'Added to Want to Read list' });
    }
  } catch (err) {
    console.error('Error updating Want to Read status:', err);
    res.status(500).json({ message: 'Error updating Want to Read status' });
  }
});

// Get current Want to Read status
app.get('/book/:isbn/want-to-read-status', async (req, res) => {
  if (!req.session.username) {
    return res.json({ willRead: 0 });
  }

  const isbn = req.params.isbn;
  const username = req.session.username;

  try {
    const [rows] = await pool.query(
      'SELECT willRead FROM `Reads` WHERE isbn = ? AND username = ?',
      [isbn, username]
    );
    if (rows.length > 0) {
      res.json({ willRead: rows[0].willRead });
    } else {
      res.json({ willRead: 0 });
    }
  } catch (err) {
    console.error('Error fetching Want to Read status:', err);
    res.status(500).json({ willRead: 0 });
  }
});

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

const { sendPasswordResetEmail } = require('./email'); // Import the function to send password reset email
const express = require('express');
const bodyParser = require('body-parser');
/********** */
const pg = require('pg');
//const mysql = require('mysql');
/********** */
const app = express();
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const bcrypt = require('bcrypt');
const activeSessions = {};// Store active sessions with their last heartbeat timestamps
//const { sendPasswordResetEmail } = require('./email'); // Import the function to send password reset email
const config = require('./config'); // Assuming config.js is in the same directory
const zxcvbn = require('zxcvbn'); // Example library for password strength estimation

const port = 3000;
// Database pfe connection
const db = require('./connection.js');
const fs = require('fs');
const { Client } = require('pg');
const multer = require('multer'); 
const { Pool } = require('pg');
const upload = multer({ dest: 'uploads/' });
const csv = require('csv-parser');



app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

app.use(session({
    secret: 'SECRET',
    resave: false,
    saveUninitialized: true,
    cookie: 
    {
        maxAge: 2 * 60 * 1000 // 2 minutes
    }
}
));
 
app.use(bodyParser.json());//used to handle conversation to and from json

app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true
}));
  
app.post('/register', async (req, res) => {
    const {  firstName, lastName, company,emailAddress, password, localisation, baseName,Type } = req.body;
   

    try {
        // Hash the password
        const hashedPassword  = await bcrypt.hash(password, 10);
        // Insert user data into the users table
        let userQuery;
        let queryParams;
        if (Type === 'admin') {
            userQuery = `
            INSERT INTO "Users" ("firstName", "lastName", "company", "email", "password", "Type","baseName") 
            VALUES ($1, $2, $3, $4, $5, $6,$7) 
            RETURNING id`;
            queryParams = [ firstName, lastName,company, emailAddress, hashedPassword,Type, 'pfe'];
        } else {
            userQuery = `
            INSERT INTO "Users" ("firstName", "lastName", "company", "email", "password", "Type","baseName") 
            VALUES ($1, $2, $3, $4, $5, $6,$7) 
            RETURNING id`;
            queryParams = [firstName, lastName,company, emailAddress, hashedPassword, Type,baseName];
        }

        const { rows } = await db.query(userQuery, queryParams);

        console.log('Executing query:', userQuery);


       // const { rows } = await db.query(userQuery, [ firstName, lastName,company, emailAddress, hashedPassword ,Type,baseName]);

       // console.log('Executing query:', userQuery);

        const userId = rows[0].id;

        // Insert into admin table if the role is admin
        if (Type === 'admin') {
            const adminQuery = `
            INSERT INTO "Admin" ("id", "firstName", "lastName", "company", "email", "password", "Type","baseName") VALUES ($1, $2, $3, $4, $5, $6, $7,$8)`;
            await db.query(adminQuery, [userId, firstName, lastName, company,emailAddress, hashedPassword, Type, 'pfe']);
        }
 
        // Insert into client table if the role is manager or employer
        if (Type === 'manager') {
            const managerQuery = `
                INSERT INTO "Manager" ("id", "firstName", "lastName", "company", "email", "password", "Type", "baseName")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
            await db.query(managerQuery, [userId, firstName, lastName, company,emailAddress, hashedPassword, Type,baseName]);
        } 

        // Insert into client table if the role is manager or employer
        if (Type === 'employee') {
            const employerQuery = `
                INSERT INTO "employee" ("id", "firstName", "lastName", "company", "localisation", "email", "password", "Type",  "baseName")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
            await db.query(employerQuery, [userId, firstName, lastName,company, localisation,emailAddress, hashedPassword,Type, baseName]);
        } 

        return res.status(201).json({ message: 'User registered successfully' });
    } 
    catch (error) {
        console.error('Error during registration:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

let base;

//the base connection instance
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Query the database for the user
        const { rows } = await db.query('SELECT * FROM "Users" WHERE email = $1', [email]);

        // Check if user exists
        if (rows.length > 0) {
            const storedPassword = rows[0].password;

            // Compare the plaintext password with the hashed password stored in the database
            const isPasswordValid = await bcrypt.compare(password, storedPassword);

            if (isPasswordValid) {
                // Authentication successful
                const { id, firstName, lastName, Type, baseName, company } = rows[0];
                await db.query('INSERT INTO user_activities (user_id, activity_type, timestamp) VALUES ($1, $2, NOW())', [id, 'login']);

                let userData = { id,firstName,lastName,Type,baseName,company };

                // Dynamically change the base connection for manager and employer roles
                if (Type === 'admin') {
                    // If the user is an admin, no additional data is needed
                    res.status(200).json({ message: 'Login successful', userData });
                } else if (Type === 'manager' || Type === 'employee') {
                    // Update the base connection dynamically
                    base = new Pool({
                        host: "localhost",
                        user: "postgres",
                        port: 5432,
                        password: "khedma123",
                        database: baseName
                    });
                   //   console.log("the database name is", base)
                    // Fetch additional data from the respective table based on the user's ID
                    let additionalDataQuery;
                    if (Type === 'manager') {
                        additionalDataQuery = await db.query('SELECT company FROM "Manager" WHERE id = $1', [id]);
                    } else {
                        additionalDataQuery = await db.query('SELECT company, localisation FROM employee WHERE id = $1', [id]);
                    }

                    if (additionalDataQuery.rows.length > 0) {
                        const { company, localisation } = additionalDataQuery.rows[0];
                        userData = { ...userData, company, localisation };
                    }
                    //console.log(userData);
                    res.status(200).json({ message: 'Login successful', userData });
                } else {
                    res.status(401).json({ message: 'Invalid role' });
                }
            } else {
                res.status(401).json({ message: 'Invalid email or password' });
            }
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add a logout endpoint to close the base connection
app.post('/logout', (req, res) => {
    // Close the base connection
    if (base) {
        base.end()
            .then(() => {
                console.log('Base connection closed');
                res.status(200).json({ message: 'Logout successful' });
            })
            .catch(err => {
                console.error('Error closing base connection:', err);
                res.status(500).json({ error: 'Error closing connection' });
            });
    } else {
        res.status(200).json({ message: 'No active connection to close' });
    }
});

app.post('/close-connection',async (req, res) => {
    try{
        await dbkastello.end();
        console.log('Database connection closed');
        res.status(200).json({message: 'connection closed sucessfully'});
    } catch (error) {
        console.error('Error closing connection:', error);
        res.status(500).json ({error: 'Error closing connection'});
    }
})
 
app.post('/forget-password', (req, res) => {
    const { email } = req.body;

    // Query the database to check if the email exists
    db.query('SELECT * FROM "Users" WHERE email = $1', [email], (err, result) => {
        if (err) {
            console.error('Error checking email:', err);
            res.status(500).json({ error: 'Error checking email' });
        } else {
            // If a user with the provided email exists
            if (result.rows.length > 0) {
                // Generate a password reset token with expiration time
                const token = jwt.sign({ email }, config.secretKey, { expiresIn: '2m' });

                // Send the password reset email with the token
                sendPasswordResetEmail(email, token)
                    .then(() => {
                        res.status(200).json({ message: 'Password reset email sent successfully' });
                    })
                    .catch(error => {
                        console.error('Error sending password reset email:', error);
                        res.status(500).json({ error: 'Error sending password reset email' });
                    });
            } else {
                // If no user found with the provided email
                res.status(404).json({ error: 'Email address not found' });
            }
        }
    });
});
 
app.post('/reset-password', (req, res) => {
    const { newPassword, email } = req.body;
    
    // Query the database to check if the email exists
    db.query('SELECT * FROM "Users" WHERE email = $1', [email], (err, result) => {
        if (err) {
            console.error('Error checking email:', err);
            res.status(500).json({ error: 'Error checking email' });
        } else {
            // If a user with the provided email exists
            if (result.rows.length > 0) {
                const userType = result.rows[0].Type; // Get the user role
                
                // Hash the new password
                bcrypt.hash(newPassword, 10, (hashErr, hashedPassword) => {
                    if (hashErr) {
                        console.error('Error hashing password:', hashErr);
                        res.status(500).json({ error: 'Error hashing password' });
                    } else {
                        let updateQuery;
                        // Construct the appropriate SQL query based on the userType
                        switch (userType) {
                            case 'admin':
                                updateQuery = `
                                    UPDATE "Admin" SET password = $1 WHERE email = $2;
                                `;
                                db.query(updateQuery, [hashedPassword, email], (updateErr1) => {
                                    if (updateErr1) {
                                        console.error('Error resetting password:', updateErr1);
                                        res.status(500).json({ error: 'Error resetting password' });
                                    } else {
                                        // Update the password in the "users" table
                                        const updateQueryUser = `
                                            UPDATE "Users" SET password = $1 WHERE email = $2;
                                        `;
                                        db.query(updateQueryUser, [hashedPassword, email], (updateErr2) => {
                                            if (updateErr2) {
                                                console.error('Error resetting password:', updateErr2);
                                                res.status(500).json({ error: 'Error resetting password' });
                                            } else {
                                                console.log('Password reset successful');
                                                res.status(200).json({ message: 'Password reset successful' });
                                                
                                                // Insert the user activity into user_activities table
                                                const userId = result.rows[0].id;
                                                const activityQuery = `INSERT INTO user_activities (user_id, activity_type) VALUES ($1, 'password reset');`;
                                                db.query(activityQuery, [userId], (activityErr) => {
                                                    if (activityErr) {
                                                        console.error('Error inserting user activity:', activityErr);
                                                        // Don't return an error response here as it's not critical
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                                break;
                                case 'manager':
                                    updateQuery = `
                                        UPDATE "Manager" SET password = $1 WHERE email = $2 ;
                                    `;
                                    db.query(updateQuery, [hashedPassword, email], (updateErr1) => {
                                        if (updateErr1) {
                                            console.error('Error resetting password:', updateErr1);
                                            res.status(500).json({ error: 'Error resetting password' });
                                        } else {
                                            // Update the password in the "users" table
                                            const updateQueryUser = `
                                                UPDATE "Users" SET password = $1 WHERE email = $2 ;
                                            `;
                                            db.query(updateQueryUser, [hashedPassword, email], (updateErr2) => {
                                                if (updateErr2) {
                                                    console.error('Error resetting password:', updateErr2);
                                                    res.status(500).json({ error: 'Error resetting password' });
                                                } else {
                                                    console.log('Password reset successful');
                                                    res.status(200).json({ message: 'Password reset successful' });
                                
                                                    // Insert the user activity into user_activities table
                                                    const userId = result.rows[0].id;
                                                    const activityQuery = `INSERT INTO user_activities (user_id, activity_type) VALUES ($1, 'password reset');`;
                                                    db.query(activityQuery, [userId], (activityErr) => {
                                                        if (activityErr) {
                                                            console.error('Error inserting user activity:', activityErr);
                                                            // Don't return an error response here as it's not critical
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                    break;
                                case 'employee':
                                    updateQuery = `
                                        UPDATE "employee" SET password = $1 WHERE email = $2;
                                    `;
                                    db.query(updateQuery, [hashedPassword, email], (updateErr1) => {
                                        if (updateErr1) {
                                            console.error('Error resetting password:', updateErr1);
                                            res.status(500).json({ error: 'Error resetting password' });
                                        } else {
                                            // Update the password in the "users" table
                                            const updateQueryUser = `
                                                UPDATE "Users" SET password = $1 WHERE email = $2 ;

                                            `;
                                            db.query(updateQueryUser, [hashedPassword, email], (updateErr2) => {
                                                if (updateErr2) {
                                                    console.error('Error resetting password:', updateErr2);
                                                    res.status(500).json({ error: 'Error resetting password' });
                                                } else {
                                                    console.log('Password reset successful');
                                                    res.status(200).json({ message: 'Password reset successful' });
                                
                                                    // Insert the user activity into user_activities table
                                                    const userId = result.rows[0].id;
                                                    const activityQuery = `INSERT INTO user_activities (user_id, activity_type) VALUES ($1, 'password reset');`;
                                                    db.query(activityQuery, [userId], (activityErr) => {
                                                        if (activityErr) {
                                                            console.error('Error inserting user activity:', activityErr);
                                                            // Don't return an error response here as it's not critical
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                    break;
                                
                            default:
                                return res.status(400).json({ error: 'Invalid userType' });
                        }
                    }
                });
            } else {
                // If no user found with the provided email
                res.status(404).json({ error: 'Email address not found' });
            }
        }
    });
});
/**************************************Databases : Creation & uploading ****************************** */

// Route to execute SQL script file and create database
/*app.post('/create-database', async (req, res) => { 
    try {
        const { baseName } = req.body; // Destructuring baseName from the request body
        //console.log('Received baseName:', baseName); // Log the received baseName
        
      // Create the database dynamically
      await db.query(`CREATE DATABASE ${baseName};`);
      // Insert the database name into the 'databases' table
      const insertQuery = 'INSERT INTO databases ("baseName") VALUES ($1)';
      const insertValues = [baseName];

      await db.query(insertQuery, insertValues);
      // Connect to the newly created database
      const dbPool = new Client({
        host: "localhost",
        user: "postgres",
        port: 5432,
        password: "khedma123",
        database: baseName
      }); 
   
      await dbPool.connect();
  
      // Read the SQL script file
      const sqlScript = fs.readFileSync('C:/Users/boual/Desktop/ZAI-pfe/PFE/PFE/backend/scriptBase.sql', { encoding: 'utf-8' });
  
      // Execute the table creation scripts 
      await dbPool.query(sqlScript);
   
      // Close the connection
      await dbPool.end();
  
      res.status(200).json({ message: 'Database created successfully.' });
    } catch (error) {
      console.error('Error executing SQL script:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});*/
app.post('/create-database', async (req, res) => { 
    try {
        const { baseName } = req.body;

        // Create the database dynamically
        await db.query(`CREATE DATABASE ${baseName};`);
        console.log(`Database ${baseName} creation command executed.`);

        // Insert the database name into the 'databases' table
        const insertQuery = 'INSERT INTO databases ("baseName") VALUES ($1)';
        const insertValues = [baseName];
        await db.query(insertQuery, insertValues);

        // Function to add a delay
        function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // Add a delay to ensure the database is fully created
        await delay(2000); // Delay for 2 seconds

        // Verify the database was created
        const checkDbQuery = `SELECT datname FROM pg_catalog.pg_database WHERE lower(datname) = lower($1);`;
        const dbExists = await db.query(checkDbQuery, [baseName]);
        if (dbExists.rowCount === 0) {
            throw new Error(`Database ${baseName} does not exist after creation.`);
        }
        console.log(`Database ${baseName} exists after creation.`);
 
        // Connect to the newly created database
        const dbPool = new Client({
            host: "localhost",
            user: "postgres",
            port: 5432,
            password: "khedma123",
            database: baseName
        });
 
        await dbPool.connect();
        console.log(`Connected to database ${baseName}.`);

        // Read the SQL script file
        const sqlScript = fs.readFileSync('C:/Users/boual/Desktop/ZAI-pfe/PFE/PFE/backend/scriptBase.sql', { encoding: 'utf-8' });

        // Execute the table creation scripts 
        await dbPool.query(sqlScript);
        console.log(`SQL script executed on database ${baseName}.`);

        // Close the connection
        await dbPool.end();
        console.log(`Connection to database ${baseName} closed.`);

        res.status(200).json({ message: 'Database created successfully.' });
    } catch (error) {
        console.error('Error executing SQL script:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Inserting data to client database
app.post('/insert-data', upload.fields([
    { name: 'client', maxCount: 1 },
    { name: 'lignes', maxCount: 1 },
    { name: 'produit', maxCount: 1 },
    { name: 'stock', maxCount: 1 }, 
    { name: 'vente', maxCount: 1 }
]), (req, res) => {
    const { databaseName, userId } = req.body;

    base.connect(async (error, client, release) => {
        if (error) {
            console.error("Error connecting to Database:", error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        console.log(databaseName)
        try {
            await client.query('BEGIN'); // Start transaction

            const fileProcessingPromises = Object.keys(req.files).map((fieldName) => {
                const file = req.files[fieldName][0];
                const tableName = fieldName;

                return new Promise((resolve, reject) => {
                    const rows = [];
                    fs.createReadStream(file.path)
                        .pipe(csv())
                        .on('data', (row) => {
                            const processedRow = {};
                            for (const [key, value] of Object.entries(row)) {
                                processedRow[key] = value === '' ? null : value;
                            }
                            rows.push(processedRow);
                        })
                        .on('end', async () => {
                            try {
                                for (const row of rows) {
                                    const values = Object.values(row);
                                    const placeholders = values.map((_, index) => `$${index + 1}`).join(',');
                                    const query = `INSERT INTO ${tableName} VALUES (${placeholders})`;

                                    await client.query(query, values);
                                }
                                fs.unlinkSync(file.path); // Remove the temporary file after processing
                                resolve();
                            } catch (err) {
                                console.error(`Error inserting data into ${tableName}:`, err);
                                reject(err); // This will trigger a rollback
                            }
                        })
                        .on('error', (err) => {
                            console.error(`Error reading file ${file.path}:`, err);
                            reject(err);
                        });
                });
            });

            await Promise.all(fileProcessingPromises); // Wait for all files to be processed

            await client.query('COMMIT'); // Commit transaction

            // Execute actionQuery and actionValues using the separate db connection
            const actionQuery = `
                INSERT INTO user_activities (user_id, activity_type, timestamp)
                VALUES ($1, $2, NOW())
                RETURNING id`;
            const actionValues = [userId, 'upload data'];

            try {
                await db.query(actionQuery, actionValues); // Use the separate db connection
                res.status(200).json({ message: 'Data inserted successfully' });
            } catch (err) {
                console.error('Error recording user activity:', err);
                res.status(500).json({ error: 'Internal Server Error' });
            }

        } catch (err) {
            await client.query('ROLLBACK'); // Rollback transaction on error
            console.error('Transaction error:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } finally {
            release(); // Release the client back to the pool
        }
    });
});

/**************************************Admin Dashboard ****************************** */

app.get('/api/users', (req, res) => {
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || '"firstName"';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';
    const page = parseInt(req.query.page) || 1;
    const rowsPerPage = parseInt(req.query.rowsPerPage) || 10;
    const offset = (page - 1) * rowsPerPage;

    const searchCondition = ` 
        WHERE
            u."firstName" ILIKE $1 OR
            u."lastName" ILIKE $1 OR
            u."company" ILIKE $1 OR
            u."Type" ILIKE $1
    `;

    const query1 = `
        SELECT 
            u."id",
    u."firstName" AS "firstName",
            u."lastName",
            u."company",
            u."Type",
            u."password",
            CASE
                WHEN u."Type" = 'employee' THEN e."localisation"
                ELSE '_'
            END AS "localisation",
            ua_reset.activity_type AS "last_reset_password_action",
            ua_reset.timestamp AS "last_reset_password_timestamp",
            CASE
                WHEN LENGTH(u."password") <= 8 THEN 'Normal'
                WHEN LENGTH(u."password") > 8 AND 
                    u."password" ~ '[[:upper:]]' AND 
                    u."password" ~ '[[:punct:]]' THEN 'Strong'
                WHEN LENGTH(u."password") > 8 AND 
                    u."password" ~ '[[:upper:]]' THEN 'Medium'
                ELSE 'Weak'
            END AS "password_strength"
        FROM 
            "Users" u
        LEFT JOIN 
            "employee" e ON u.id = e.id
        LEFT JOIN LATERAL (
            SELECT 
                activity_type,
                timestamp
            FROM 
                user_activities
            WHERE 
                user_id = u.id AND activity_type = 'login' 
            ORDER BY 
                timestamp DESC
            LIMIT 1
        ) ua_reset ON TRUE
        ${searchCondition}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $2 OFFSET $3;
    `;

    const query2 = `
        SELECT 
            u."id",
    u."firstName" AS "firstName",
            u."lastName",
            u."company",
            u."Type",
            u."password",
            CASE
                WHEN u."Type" = 'employee' THEN e."localisation"
                ELSE '_'
            END AS "localisation",
            ua_reset.activity_type AS "last_reset_password_action",
            ua_reset.timestamp AS "last_reset_password_timestamp",
            CASE
                WHEN LENGTH(u."password") <= 8 THEN 'Normal'
                WHEN LENGTH(u."password") > 8 AND 
                    u."password" ~ '[[:upper:]]' AND 
                    u."password" ~ '[[:punct:]]' THEN 'Strong'
                WHEN LENGTH(u."password") > 8 AND 
                    u."password" ~ '[[:upper:]]' THEN 'Medium'
                ELSE 'Weak'
            END AS "password_strength"
        FROM 
            "Users" u
        LEFT JOIN 
            "employee" e ON u.id = e.id
        LEFT JOIN LATERAL (
            SELECT 
                activity_type,
                timestamp
            FROM 
                user_activities
            WHERE 
                user_id = u.id AND activity_type = 'password reset'
            ORDER BY 
                timestamp DESC
            LIMIT 1
        ) ua_reset ON TRUE
        ${searchCondition}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $2 OFFSET $3;
    `;

    const query3 = `
        SELECT 
            u."id",
    u."firstName" AS "firstName",
            u."lastName",
            u."company",
            u."Type",
            u."password",
            CASE
                WHEN u."Type" = 'employee' THEN e."localisation"
                ELSE '_'
            END AS "localisation",
            ua_reset.activity_type AS "last_reset_password_action",
            ua_reset.timestamp AS "last_reset_password_timestamp",
            CASE
                WHEN LENGTH(u."password") <= 8 THEN 'Normal'
                WHEN LENGTH(u."password") > 8 AND 
                    u."password" ~ '[[:upper:]]' AND 
                    u."password" ~ '[[:punct:]]' THEN 'Strong'
                WHEN LENGTH(u."password") > 8 AND 
                    u."password" ~ '[[:upper:]]' THEN 'Medium'
                ELSE 'Weak'
            END AS "password_strength"
        FROM 
            "Users" u
        LEFT JOIN 
            "employee" e ON u.id = e.id
        LEFT JOIN LATERAL (
            SELECT 
                activity_type,
                timestamp
            FROM 
                user_activities
            WHERE 
                user_id = u.id AND activity_type = 'upload data'
            ORDER BY 
                timestamp DESC
            LIMIT 1
        ) ua_reset ON TRUE
        ${searchCondition}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $2 OFFSET $3;
    `;

    const query4 = `
        SELECT 
            u."id",
    u."firstName" AS "firstName",
            u."lastName",
            u."company",
            u."Type",
            u."password",
            CASE
                WHEN u."Type" = 'employee' THEN e."localisation"
                ELSE '_'
            END AS "localisation",
            ua_reset.activity_type AS "last_reset_password_action",
            ua_reset.timestamp AS "last_reset_password_timestamp",
            CASE
                WHEN LENGTH(u."password") <= 8 THEN 'Normal'
                WHEN LENGTH(u."password") > 8 AND 
                    u."password" ~ '[[:upper:]]' AND 
                    u."password" ~ '[[:punct:]]' THEN 'Strong'
                WHEN LENGTH(u."password") > 8 AND 
                    u."password" ~ '[[:upper:]]' THEN 'Medium'
                ELSE 'Weak'
            END AS "password_strength"
        FROM 
            "Users" u
        LEFT JOIN 
            "employee" e ON u.id = e.id
        LEFT JOIN LATERAL (
            SELECT 
                activity_type,
                timestamp
            FROM 
                user_activities
            WHERE 
                user_id = u.id AND activity_type = 'deletion of an account'
            ORDER BY 
                timestamp DESC
            LIMIT 1
        ) ua_reset ON TRUE
        ${searchCondition}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $2 OFFSET $3;
    `;

    const countQuery = `
        SELECT COUNT(*) AS total
        FROM 
            "Users" u
        LEFT JOIN 
            "employee" e ON u.id = e.id
        ${searchCondition}
    `;

    const searchParam = `%${search}%`;

    db.query(countQuery, [searchParam], (error1, countResult) => {
        if (error1) {
            console.error('Error executing count query: ', error1);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        const total = countResult.rows[0].total;

        Promise.all([
            db.query(query1, [searchParam, rowsPerPage, offset]),
            db.query(query2, [searchParam, rowsPerPage, offset]),
            db.query(query3, [searchParam, rowsPerPage, offset]),
            db.query(query4, [searchParam, rowsPerPage, offset])
        ])
        .then(results => {
            res.json({
                query1_results: results[0].rows,
                query2_results: results[1].rows,
                query3_results: results[2].rows,
                query4_results: results[3].rows,
                total: parseInt(total, 10)
            });
        })
        .catch(error => {
            console.error('Error executing queries: ', error);
            res.status(500).json({ error: 'Internal server error' });
        });
    });
});

app.get('/api/users2', (req, res) => {
    const search = req.query.search || ''; 
    const sortBy = req.query.sortBy || '"firstName"';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';
    const page = parseInt(req.query.page) || 1;
    const rowsPerPage = parseInt(req.query.rowsPerPage) || 10;
    const offset = (page - 1) * rowsPerPage;

    const query = `
        SELECT 
            u."id",
            u."firstName",
            u."lastName",
            u."company",
            u."Type",
            CASE
                WHEN u."Type" = 'employee' THEN e."localisation"
                ELSE '_'
            END AS "localisation"
        FROM 
            "Users" u
        LEFT JOIN 
            "employee" e ON u.id = e.id
        WHERE
            u."firstName" ILIKE $1 OR
            u."lastName" ILIKE $1 OR
            u."company" ILIKE $1 OR
            u."Type" ILIKE $1
        ORDER BY 
            ${sortBy} ${sortOrder}
        LIMIT $2
        OFFSET $3
    `;

    const countQuery = `
        SELECT COUNT(*) AS total
        FROM "Users" u
        LEFT JOIN "employee" e ON u.id = e.id
        WHERE
            u."firstName" ILIKE $1 OR
            u."lastName" ILIKE $1 OR
            u."company" ILIKE $1 OR
            u."Type" ILIKE $1
    `;

    const searchParam = `%${search}%`;

    db.query(countQuery, [searchParam], (error1, countResult) => {
        if (error1) {
            console.error('Error executing count query: ', error1);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        const total = countResult.rows[0].total;

        db.query(query, [searchParam, rowsPerPage, offset], (error2, results2) => {
            if (error2) {
                console.error('Error executing query: ', error2);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            res.json({
                users: results2.rows,
                total: total
            });
        });
    });
});

app.delete('/api/actions/:id', (req, res) => {
    const userId = req.params.id;
    const loggedInUserId = req.headers['logged-in-user-id']; // Retrieve user ID from request headers
    
    if (!loggedInUserId) {
        console.error('Logged-in User ID is not provided in the headers.');
        return res.status(400).json({ error: 'Logged-in User ID is required' });
    }
    
    //console.log('User to be deleted:', userId);
    //console.log('Logged-in User ID:', loggedInUserId);

    if (!userId) {
        console.error('User ID is not provided.');
        return res.status(400).json({ error: 'User ID is required' });
    }
  
        // Now delete from other tables
        Promise.all([
         
            deleteFromTable('user_activities','user_id', userId)
        ]).then(() => {
            // Insert into user_activities to log the deletion
            return db.query('INSERT INTO user_activities (user_id, activity_type) VALUES ($1, $2)', [loggedInUserId, 'deletion of an account']);
        })
        .then(() => {
            res.json({ message: 'User and related records deleted successfully' });
        })
        .catch((error) => {
            console.error('Error deleting related records:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
});
function deleteFromTable(tableName, userIdColumnName, userId) {
    return new Promise((resolve, reject) => {
        //console.log(`Deleting from table ${tableName} where ${userIdColumnName} = ${userId}`);
        const query = `DELETE FROM "${tableName}" WHERE "${userIdColumnName}" = $1`;
        db.query(query, [userId], (error, results, fields) => {
            if (error) {
                console.error(`Error deleting from ${tableName}:`, error);
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const loggedInUserId = req.headers['logged-in-user-id']; // Retrieve user ID from request headers

    if (!loggedInUserId) {
        console.error('Logged-in User ID is not provided in the headers.');
        return res.status(400).json({ error: 'Logged-in User ID is required' });
    }

    if (!userId) {
        console.error('User ID is not provided.');
        return res.status(400).json({ error: 'User ID is required' });
    }

    //console.log('User to be deleted:', userId);
    //console.log('Logged-in User ID:', loggedInUserId);

    db.query('DELETE FROM "Users" WHERE id = $1', [userId], (error, results) => {
        if (error) {
            console.error('Error deleting user:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (results.rowCount === 0) {
            //console.log(`No user found with id ${userId}`);
            return res.status(404).json({ error: `User with id ${userId} not found` });
        }

        // Now delete from other tables
        Promise.all([
            deleteFromTable2('Manager', userId),
            deleteFromTable2('employee', userId),
            deleteFromTable2('Admin', userId)
        ]).then(() => {
            // Insert into user_activities to log the deletion
            return db.query('INSERT INTO user_activities (user_id, activity_type) VALUES ($1, $2)', [loggedInUserId, 'deletion of an account']);
        }).then(() => {
            res.json({ message: 'User and related records deleted successfully' });
        }).catch((error) => {
            console.error('Error deleting related records:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
    });
});
function deleteFromTable2(tableName, userId) {
    return new Promise((resolve, reject) => {
        //console.log(`Deleting from table ${tableName} where id = ${userId}`);
        const query = `DELETE FROM "${tableName}" WHERE id = $1`;
        db.query(query, [userId], (error, results, fields) => {
            if (error) {
                console.error(`Error deleting from ${tableName}:`, error);
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

// Endpoint to fetch basename options
app.get('/basenameOptions', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT "idBase","baseName" FROM "databases" WHERE "baseName" IS NOT NULL ;');
       //console.log('rowsss',rows);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching basename options:', error);
        res.status(500).json({ error: 'Error fetching basename options' });
    }
});

app.delete('/deleteDatabase', async (req, res) => {
    const { databaseId, baseName } = req.body;

    //console.log('Database ID:', databaseId);
    //console.log('Database Name:', baseName);
    try {
      // Connect to the PostgreSQL database
      //const client = await pool.connect();
  
      // Execute the SQL command to delete the database using its ID
      const queryText = `DROP DATABASE IF EXISTS "${baseName}"`; 
     // console.log(queryText)// This will drop the specified database
      await db.query(queryText);
  
      // Release the client back to the pool
      //client.release();
  
      // After dropping the database, delete its metadata from the "databases" table
      await db.query('DELETE FROM databases WHERE "idBase" = $1', [databaseId]);
  
      res.status(200).json({ message: `Database with ID ${databaseId} deleted successfully.` });
    } catch (error) {
      console.error('Error deleting database:', error);
      res.status(500).json({ error: 'Error deleting database' });
    }
}); 

// Endpoint to get the count of active users
app.get('/api/user/activecount', async (req, res) => {
    try {
        // Query the database to get the count of active users
        const result = await db.query('SELECT COUNT(DISTINCT user_id) AS activeUsersCount FROM "user_activities"');
      //  console.log("Database query result:", result.rows[0]);
        const activeUsersCount = result.rows[0].activeuserscount;


        res.status(200).json({ activeUsersCount });
        //console.log("activeUsersCount:", activeUsersCount);
        } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/user/login/count', async (req, res) => {
    try {
        // Query the database to get the login count for each user
        const result = await db.query('SELECT "user_id", COUNT(*) AS loginCount FROM "user_activities" WHERE "activity_type" = $1 GROUP BY "user_id"', ['login']);       
        const loginCounts = result.rows;
      //  console.log("Login counts:", loginCounts);         // Respond with the login counts for each user
        res.status(200).json({ loginCounts });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/Totalusers/count', (req, res) => {
    //console.log('SQL query:', 'SELECT COUNT(*) AS managerCount FROM public."Users" WHERE "Type" = \'manager\'');
    db.query('SELECT COUNT(*) AS nbUsers FROM "Users" ', (error, results) => {
        if (error) {
            console.error('Error counting managers:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        

        const nbUsers = results.rows[0].nbusers;
      //  console.log('nb of users ',nbUsers);
        res.json({ nbUsers });
    });
});

app.get('/api/Totaldbs/count', (req, res) => {
    db.query('SELECT COUNT(*) AS nbdb FROM public."databases" ', (error, results) => {
        if (error) {
            console.error('Error counting databases:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

      //  console.log('Query results:', results);
        const nbdb = results.rows[0].nbdb; // Ensure correct column name
      //  console.log('Employee count:', nbdb);
        res.json({ nbdb });
    });
});

app.get('/api/user/count', (req, res) => {
    const query = `
        SELECT
            SUM(CASE WHEN "Type" = 'manager' THEN 1 ELSE 0 END) AS managerCount,
            SUM(CASE WHEN "Type" = 'employee' THEN 1 ELSE 0 END) AS employeeCount,
            SUM(CASE WHEN "Type" = 'admin' THEN 1 ELSE 0 END) AS adminCount
        FROM public."Users"
    `;
    
    db.query(query, (error, results) => {
        if (error) {
            console.error('Error counting users:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

      //  console.log('Query results:', results);
        const counts = results.rows[0];
      //  console.log('User counts:', counts);
        res.json(counts);
    });
});

app.get('/api/manager/count', (req, res) => {
    const query = 'SELECT COUNT(*) AS "managerCount" FROM "Users" WHERE "Type" = \'manager\'';
    
    db.query(query, (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        const managerCount = results.rows[0].managerCount;
        res.json({ managerCount });
    });
});
 
/**************************************Manager Dashboard ****************************** */

app.get('/totalsales', async (req, res) => {
    const { codemag, type, localisation, startDate, endDate } = req.query;
    const userId = req.headers.userid; 

    // Base SQL query
    let query = `
        SELECT codemag, SUM(total) AS TotalSales 
        FROM "vente"
        WHERE nature ='VENTE'
    `;
    let queryParams = [];

    // Date filter logic
    if (startDate && endDate) {
        query += ' AND date BETWEEN $1::date AND $2::date';
        queryParams.push(startDate, endDate);
    }

    // Additional conditions based on type and localisation
    if (codemag === 'All') {
        // Total sales for all codemags
        query = `
            SELECT SUM(total) AS TotalSales 
            FROM "vente"
            WHERE nature ='VENTE'
        `;
        if (startDate && endDate) {
            query += ' AND date BETWEEN $1::date AND $2::date';
            queryParams = [startDate, endDate];
        }
    } else if (type === 'manager') {
        // For Manager
        if (codemag) {
            query += ' AND codemag = $' + (queryParams.length + 1);
            queryParams.push(codemag);
        }
        query += ' GROUP BY codemag';
    } else if (type === 'employee') {
        // For Employee
        if (localisation) {
            query += ' AND codemag = $' + (queryParams.length + 1);  // Adjust based on your filtering criteria
            queryParams.push(localisation);
        }
        if (codemag) {
            query += ' AND codemag = $' + (queryParams.length + 1);
            queryParams.push(codemag);
        }
        query += ' GROUP BY codemag';
    } else {
        // Invalid user type
        return res.status(400).json({ error: 'Invalid user type' });
    }

    try {
        const { rows } = await base.query(query, queryParams);
        res.json(rows);  // Send the filtered rows to the frontend
    } catch (error) {
        console.error('Error executing query', error.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



app.get('/salesperemployee', async (req, res) => {
    const { codemag, type, localisation, startDate, endDate } = req.query;

    // SQL query with optional filtering by Codemag
    let query = `
        SELECT codemag, vendeur, SUM(total) AS SalesPerEmployee
        FROM vente
        WHERE nature = 'VENTE'`;

    let queryParams = [];

    // Date filter logic
    if (startDate && endDate) {
        query += ' AND date BETWEEN $1::date AND $2::date';
        queryParams.push(startDate, endDate);
    }

    if (type === 'employee') {
        // For Employee, set codemag to localisation value
        if (localisation) {
            query += ' AND codemag = $' + (queryParams.length + 1);
            queryParams.push(localisation);
        } else {
            // If localisation is not provided, return a 400 error
            return res.status(400).json({ error: 'Localisation parameter is required for employee type' });
        }
    } else if (codemag) {
        // For Manager, if codemag is provided, add it to the query
        query += ' AND codemag = $' + (queryParams.length + 1);
        queryParams.push(codemag);
    }

    query += `
        GROUP BY vendeur, codemag`;

    try {
        const { rows } = await base.query(query, queryParams);
        res.json(rows);
    } catch (error) {
        console.error('Error executing SQL query:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/topsales', async (req, res) => {
    const { codemag, type, localisation } = req.query;
    const userId = req.headers.userid; // Assuming you pass user ID in headers or adjust as per your setup
    //const base = userConnections[userId]; // Get the user's specific base connection

    // SQL query with optional filtering by Codemag
    let query = `
      SELECT Designation, SUM(total) AS SalesByProduct 
      FROM lignes 
      WHERE Origine = 'INVENTAIRE OK'`;
    let queryParams = [];

    if (type === 'employee') {
        if (localisation) {
            // For Employee type, set codemag to the value of localisation
            query += ' AND codemag_id = $1';
            queryParams.push(localisation);
        } else {
            return res.status(400).json({ error: 'Localisation parameter is required for employee type' });
        }
    } else if (codemag) {
        // For Manager type or if codemag is provided, add it to the query
        queryParams.push(codemag);
    }

    if (queryParams.length > 0) {
        query += ' AND codemag_id = $1';
    }

    query += `
      GROUP BY Designation 
      ORDER BY SalesByProduct DESC 
      LIMIT 10;`;

    try {
        const { rows } = await base.query(query, queryParams);
        res.json(rows);
    } catch (error) {
        console.error('Error executing query', error.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/RecentOrders', async (req, res) => {
    const { codemag, type, localisation, search, sortBy, sortOrder, page, rowsPerPage, startDate, endDate } = req.query;
    const userId = req.headers.userid;
    
    // Parse and validate pagination parameters
    const parsedPage = parseInt(page, 10);
    const parsedRowsPerPage = parseInt(rowsPerPage, 10);
    if (isNaN(parsedPage) || isNaN(parsedRowsPerPage) || parsedPage <= 0 || parsedRowsPerPage <= 0) {
        return res.status(400).json({ error: 'Invalid pagination parameters' });
    }

    const offset = (page - 1) * parseInt(rowsPerPage, 10);
    const limit = parseInt(rowsPerPage, 10);

    let query = `
      SELECT 
        vente,
        TO_CHAR(date, 'YYYY-MM-DD') AS date,
        heure,
        codemag,
        total
      FROM 
        vente
      WHERE 
        nature = 'VENTE'`;

    let queryParams = [];

    // Apply conditions based on type of request
    if (type === 'employee') {
        if (localisation) {
            query += ' AND codemag = $1';
            queryParams.push(localisation);
        } else {
            return res.status(400).json({ error: 'Localisation parameter is required for employee type' });
        }
    } else if (codemag) {
        query += ' AND codemag = $1';
        queryParams.push(codemag);
    }

    if (startDate && endDate) {
       // query += ' AND date BETWEEN $' + (queryParams.length + 1) + ' AND $' + (queryParams.length + 2);
       query += ' AND date BETWEEN $' + (queryParams.length + 1) + '::DATE AND $' + (queryParams.length + 2) + '::DATE';

        queryParams.push(startDate, endDate);
    }

    if (search) {
        const searchCondition = `
          (vente::text ILIKE $${queryParams.length + 1} OR 
           codemag::text ILIKE $${queryParams.length + 1} OR 
           TO_CHAR(date, 'YYYY-MM-DD') ILIKE $${queryParams.length + 1})`;
        query += ` AND ${searchCondition}`;
        queryParams.push(`%${search}%`);
    }

    query += `
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${queryParams.length + 1}
      OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    try {
        const { rows } = await base.query(query, queryParams);
        const totalQuery = `SELECT COUNT(*) FROM vente WHERE nature = 'VENTE'`;
        const totalResult = await base.query(totalQuery);
        const total = parseInt(totalResult.rows[0].count, 10);

        res.json({ orders: rows, total });
    } catch (error) {
        console.error('Error executing query', error.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/transfert', async (req, res) => {
    const { search, sortBy, sortOrder, page, rowsPerPage, codemag, startDate, endDate } = req.query;
    const userId = req.headers.userid;
    const offset = (page - 1) * parseInt(rowsPerPage, 10);
    const limit = parseInt(rowsPerPage, 10);

    const sortColumnsMap = {
        codemag: "codemag",
        nature: "nature",
        date: "date",
        heure: "heure",
        total: "total",
        quantite: "quantite"
    };
    const sortColumn = sortColumnsMap[sortBy] || sortBy;
    const sortOrderUpper = sortOrder === 'DESC' ? 'DESC' : 'ASC';

    let query = `
        SELECT 
            codemag, 
            nature, 
            TO_CHAR(date, 'YYYY-MM-DD') AS date, 
            heure, 
            total, 
            quantite
        FROM 
            vente
        WHERE 
            vshopstatus = 'Création TRANSFERT'
    `;

    const queryParams = [];

    if (codemag) {
        query += ' AND codemag = $1';
        queryParams.push(codemag);
    }

    if (startDate && endDate) {
        query += ' AND date BETWEEN $' + (queryParams.length + 1) + ' AND $' + (queryParams.length + 2);
        queryParams.push(startDate, endDate);
    }
    
    

    if (search) {
        const searchCondition = `
            (codemag::text ILIKE $${queryParams.length + 1} OR 
             nature::text ILIKE $${queryParams.length + 1} OR 
             TO_CHAR(date, 'YYYY-MM-DD') ILIKE $${queryParams.length + 1} OR
             heure::text ILIKE $${queryParams.length + 1} OR
             total::text ILIKE $${queryParams.length + 1} OR
             quantite::text ILIKE $${queryParams.length + 1})`;
        query += ` AND ${searchCondition}`;
        queryParams.push(`%${search}%`);
    }

    query += `
    ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
    LIMIT $${queryParams.length + 1}
    OFFSET $${queryParams.length + 2}`;
  queryParams.push(limit, offset);


    try {
        const { rows } = await base.query(query, queryParams);
        const totalQuery = `
            SELECT COUNT(*)
            FROM vente
            WHERE vshopstatus = 'Création TRANSFERT'
        `;
        const totalResult = await base.query(totalQuery);
        const total = parseInt(totalResult.rows[0].count, 10);
        res.json({ transferts: rows, total });
    } catch (error) {
        console.error('Error executing SQL query:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



app.get('/clientCount', async (req, res) => {
    const userId = req.headers.userid; // Assuming you pass user ID in headers or adjust as per your setup
    //const base = userConnections[userId]; // Get the user's specific base connection

    try {
      const { rows } = await base.query(`SELECT COUNT(DISTINCT Client) AS CustomerCount FROM client;`);
      res.json(rows[0]);
    //  console.log('rows',rows)
    } catch (error) {
     // console.error('Error executing query', error.stack);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/NewLoyalCustomer', (req, res) => {
    const userId = req.headers.userid; // Assuming you pass user ID in headers or adjust as per your setup
    //const base = userConnections[userId]; // Get the user's specific base connection

    const codemag = req.query.codemag;
    const { startDate, endDate } = req.query;
    //console.log("startDateEEEEe", startDate);
    //console.log("endDateEEEEe", endDate);

    let query = `
        SELECT
            SUM(CASE WHEN NbPassage = 1 THEN 1 ELSE 0 END) AS NewCustomers,
            SUM(CASE WHEN NbPassage > 1 AND NbPassage < 4 THEN 1 ELSE 0 END) AS NormalCustomers,
            SUM(CASE WHEN NbPassage >= 4 THEN 1 ELSE 0 END) AS LoyalCustomers
        FROM client`;

    const queryParams = [];

    if (codemag || startDate || endDate) {
        query += ' WHERE';

        if (codemag) {
            query += ' magasincreation = $1';
            queryParams.push(codemag);
        }

        if (startDate && endDate) {
            if (codemag) {
                query += ' AND';
            }
            query += ` DateCreation >= $${queryParams.length + 1} AND DateCreation <= $${queryParams.length + 2}`;
            queryParams.push(startDate, endDate);

        }
    }

    base.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error executing SQL query:', err);
            return res.status(500).json({ error: err.message });
        }

        if (results.rows.length === 0 || !results.rows[0].newcustomers) {
            return res.status(404).json({ error: 'No data found' });
        }

        res.json(results.rows[0]);
    });
});


app.get('/stockLevels', (req, res) => {
    const userId = req.headers.userid; // Assuming you pass user ID in headers or adjust as per your setup
    //const base = userConnections[userId]; // Get the user's specific base connection

    const query = `
    SELECT 
    DATE_FORMAT(s.Date, '%Y-%m') AS Month,
    REPLACE(s.Designation, '�', '°') AS Designation,
    SUM(s.Qte) AS TotalStock
FROM 
    stock s
GROUP BY 
    Month, Designation
ORDER BY 
    Month DESC, TotalStock DESC
LIMIT 10;


    
    `;
    base.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results.rows);
        //console.log("stocklevel :",results.rows)
    });
});

app.get('/storessales', (req, res) => {
    const userId = req.headers.userid; // Assuming you pass user ID in headers or adjust as per your setup
    //const base = userConnections[userId]; // Get the user's specific base connection

    const codemag = req.query.codemag;  // Get the Codemag from query parameters
    let query = `
    WITH CodemagSales AS (
        SELECT 
            codemag_id,
            SUM(total) AS TotalSales
        FROM 
            public.lignes`;

    let queryParams = [];

    if (codemag) {
        query += ' WHERE codemag_id = $1';
        queryParams.push(codemag);
    }

    query += `
        GROUP BY 
            codemag_id
    )
    SELECT 
        ROW_NUMBER() OVER (ORDER BY codemag_id) AS Id,
        codemag_id,
        TotalSales
    FROM 
        CodemagSales`;

        base.query(query, queryParams, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results.rows);
    });
});
 

app.get('/monthly_sales_revenue', async (req, res) => {
    const userId = req.headers.userid; // Assuming you pass user ID in headers or adjust as per your setup
    //const base = userConnections[userId]; // Get the user's specific base connection

    const { codemag, Type, localisation, startDate, endDate } = req.query;

    // SQL query with optional filtering by Codemag
    let query = `
        SELECT TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') AS Month, SUM(total) AS MonthlySalesRevenue
        FROM vente
        WHERE nature = 'VENTE'`; // Filter by nature

    let queryParams = [];

    // Apply conditions based on Type of request
    if (Type === 'employee') {
        // For Employee, filter by localisation
        if (localisation) {
            query += ' AND codemag = $1';
            queryParams.push(localisation);
        } else {
            // If localisation is not provided, return a 400 error
            return res.status(400).json({ error: 'Localisation parameter is required for employee type' });
        }
    } else if (codemag) {
        // For Manager, if codemag is provided, add it to the query
        query += ' AND codemag = $1';
        queryParams.push(codemag);
    }

    // Filter by startDate and endDate if provided
    if (startDate && endDate) {
        // Ensure proper date comparison format based on your database
        query += ' AND date BETWEEN TO_DATE($' + (queryParams.length + 1) + ", 'YYYY-MM-DD') AND TO_DATE($" + (queryParams.length + 2) + ", 'YYYY-MM-DD')";
        queryParams.push(startDate, endDate);
    }

    query += `
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY Month`;

    try {
        const { rows } = await base.query(query, queryParams);
        res.json(rows);
    } catch (error) {
        console.error('Error executing SQL query:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/total-sales-monthly', async (req, res) => {
    const { codemag } = req.query;

    try {
        let query;
        let params = [];

        if (codemag === 'All') {
            query = `
                 SELECT 
                    SUM(v.total) AS total_sales
                FROM 
                    vente v
                WHERE 
                    date_part('month', v.date) = date_part('month', CURRENT_DATE) AND
                    date_part('year', v.date) = date_part('year', CURRENT_DATE)
            `;
        } else {
            query = `
                SELECT 
                    SUM(v.total) AS total_sales
                FROM 
                    vente v
                WHERE 
                    v.codemag = $1 AND
                    date_part('month', v.date) = date_part('month', CURRENT_DATE) AND
                    date_part('year', v.date) = date_part('year', CURRENT_DATE)
            `;
            params.push(codemag);
        }

       

        const result = await base.query(query, params);


        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            console.log("No matching rows found.");
            res.json({ total_sales: null });
        }
    } catch (error) {
        console.error('Error fetching total sales:', error);
        res.status(500).send(`Server error: ${error.message}`);
    }
});

// Endpoint to get Codemag names
app.get('/codemags', async (req, res) => {
    const userId = req.headers.userid; // Assuming you pass user ID in headers or adjust as per your setup
    //const base = userConnections[userId]; // Get the user's specific base connection

    try {
        const { rows } = await base.query('SELECT DISTINCT codemag_id FROM "lignes"');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/***********************************Employee Dashboard ******************** */
app.get('/salesbyproduct', async (req, res) => {
    const base = userConnections.get(userId);
    try {
      const { rows } = await base.query("SELECT Designation, SUM(total) AS SalesByProduct FROM lignes WHERE Designation <> '' GROUP BY Designation ");
      //console.log("Fetched data:", rows); // Log the fetched data
      res.json(rows);
    } catch (error) {
      console.error('Error executing query', error.stack);
      res.status(500).json({ error: 'Internal Server Error' });
    }
}); 

app.get('/TotalSalesCount', async (req, res) => {
    const { localisation, startDate, endDate } = req.query;
    // const base = userConnections.get(userId);
    
    try {
           let query = `
            SELECT COUNT(*) AS TotalVente 
            FROM vente
            WHERE codemag = $1
        `;
        let queryParams = [localisation];
        
        if (startDate && endDate) {
            query += ' AND date BETWEEN $2::date AND $3::date';
            queryParams.push(startDate, endDate);
        }
        
        const { rows } = await base.query(query, queryParams);
        
        res.json(rows);
    } catch (error) {
        console.error('Error executing query', error.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



app.get('/TotalQuantitySold', async (req, res) => {
    const { localisation , startDate, endDate } = req.query;
   // const base = userConnections.get(userId);
    try {
      let query =`
        SELECT SUM(quantite) AS TotalQuantitySold 
        FROM vente 
        where nature ='VENTE'
        AND codemag = $1
        `;
        let queryParams = [localisation];
        
        if (startDate && endDate) {
            query += ' AND date BETWEEN $2::date AND $3::date';
            queryParams.push(startDate, endDate);
        }
        const { rows } = await base.query(query, queryParams);

      res.json(rows);
    } catch (error) {
      console.error('Error executing query', error.stack);
      res.status(500).json({ error: 'Internal Server Error' });
    }
}); 
/*
app.get('/api/repeat-customer-data', async (req, res) => {
    try {
        const { localisation, startDate, endDate } = req.query; // Extract localisation, startDate, and endDate from query parameters
console.log("startDate rep",startDate)
console.log("endDate rep",endDate)
        const repeatQuery = `
            SELECT COUNT(*) AS RepeatCustomers 
            FROM client 
            WHERE (nbpassage > 2 OR nbpassage = 2) 
            AND magasincreation = $1
            AND date_dernierachat BETWEEN $2::date AND $3::date`; // Filter by localisation and date_dernierachat range

        const infrequentQuery = `
            SELECT COUNT(*) AS InfrequentCustomers 
            FROM client 
            WHERE nbpassage < 2
            AND magasincreation = $1
            AND date_dernierachat BETWEEN $2::date AND $3::date`; // Filter by localisation and date_dernierachat range

        const repeatResult = await base.query(repeatQuery, [localisation, startDate, endDate]);
        const infrequentResult = await base.query(infrequentQuery, [localisation, startDate, endDate]);

        const repeatCustomers = repeatResult.rows[0].repeatcustomers;
        const infrequentCustomers = infrequentResult.rows[0].infrequentcustomers;
        console.log("repeatCustomers",repeatCustomers)
        console.log("infrequentCustomers",infrequentCustomers)
        res.json({
            repeatCustomers: repeatCustomers,
            infrequentCustomers: infrequentCustomers
        });
    } catch (error) {
        console.error('Error executing query', error.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});*/
app.get('/api/repeat-customer-data', async (req, res) => {
    try {
        const { localisation, startDate, endDate } = req.query; // Extract localisation, startDate, and endDate from query parameters

        // Base queries to count repeat and infrequent customers
        let repeatQuery = `
            SELECT COUNT(*) AS RepeatCustomers 
            FROM client 
            WHERE (nbpassage > 2 OR nbpassage = 2) 
            AND magasincreation = $1`; // Filter by localisation

        let infrequentQuery = `
            SELECT COUNT(*) AS InfrequentCustomers 
            FROM client 
            WHERE nbpassage < 2
            AND magasincreation = $1`; // Filter by localisation

        let repeatParams = [localisation];
        let infrequentParams = [localisation];

        // If startDate and endDate are provided, add date filter conditions
        if (startDate && endDate) {
            repeatQuery += ' AND date_dernierachat BETWEEN $2::date AND $3::date';
            infrequentQuery += ' AND date_dernierachat BETWEEN $2::date AND $3::date';
            repeatParams.push(startDate, endDate);
            infrequentParams.push(startDate, endDate);
        }

        // Execute queries to get counts
        const repeatResult = await base.query(repeatQuery, repeatParams);
        const infrequentResult = await base.query(infrequentQuery, infrequentParams);

        // Extract counts from query results
        const repeatCustomers = repeatResult.rows[0].repeatcustomers || 0;
        const infrequentCustomers = infrequentResult.rows[0].infrequentcustomers || 0;

       /// console.log("repeatCustomers", repeatCustomers);
       // console.log("infrequentCustomers", infrequentCustomers);

        // Send JSON response with counts
        res.json({
            repeatCustomers: repeatCustomers,
            infrequentCustomers: infrequentCustomers
        });
    } catch (error) {
        console.error('Error executing query', error.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



app.get('/stockFournisseur', async (req, res) => {
    const { localisation, search, sortBy, sortOrder, page, rowsPerPage } = req.query;

    const sortColumn = sortBy || 'fournisseur'; // Default sorting column
    const sortDirection = sortOrder === 'desc' ? 'DESC' : 'ASC'; // Default sorting order
    const limit = rowsPerPage ? parseInt(rowsPerPage) : 10; // Default rows per page
    const offset = page ? (parseInt(page) - 1) * limit : 0; // Default page is 1

    let searchCondition = '';
    let values = [localisation, limit, offset];

    if (search) {
        const searchValue = `%${search}%`;
        searchCondition = `
            AND (
                designation ILIKE $2 OR
                famille ILIKE $2 OR
                fournisseur ILIKE $2
            )
        `;
        values = [localisation, searchValue, limit, offset];
    }

    const query = `
        SELECT
            designation,
            famille,
            SUM(qte) AS total_qte,
            fournisseur
        FROM
            stock
        WHERE
            codemag = $1
            ${searchCondition}
        GROUP BY
            codemag,
            fournisseur,
            famille,
            designation
        HAVING
            SUM(qte) > 0
        ORDER BY
            ${sortColumn} ${sortDirection}
        LIMIT $${values.length - 1} OFFSET $${values.length};
    `;

    try {
        const { rows } = await base.query(query, values);
        const totalQuery = `
            SELECT COUNT(*)
            FROM (
                SELECT
                    designation,
                    famille,
                    SUM(qte) AS total_qte,
                    fournisseur
                FROM
                    stock
                WHERE
                    codemag = $1
                    ${searchCondition}
                GROUP BY
                    codemag,
                    fournisseur,
                    famille,
                    designation
                HAVING
                    SUM(qte) > 0
            ) AS totalStock;
        `;
        const totalValues = [localisation];
        if (search) {
            totalValues.push(`%${search}%`);
        }
        const totalResult = await base.query(totalQuery, totalValues);
        const totalRows = totalResult.rows[0].count;

        res.json({
            stockData: rows,
            totalRows: parseInt(totalRows, 10)
        });
     //   console.log("Fetched data:", rows); // Log the fetched data
    } catch (error) {
        console.error('Error executing query', error.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



app.get('/famille', async (req, res) => {
   // const base = userConnections.get(userId);
    try {
        const { rows } = await base.query(`
            SELECT DISTINCT famille 
            FROM lignes 
            WHERE famille IS NOT NULL 
            AND famille NOT LIKE '~%'
`);
        res.json(rows);
      //  console.log("famille :",rows)
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/AvgDailySales', async (req, res) => {
    const { localisation } = req.query;
    // SQL query with optional filtering by Codemag
    let query = `
        WITH daily_sales AS (
            SELECT
                Date,
                ROUND(SUM(Total), 2) AS daily_total_sales
            FROM
                vente
            WHERE
                Codemag = $1
            GROUP BY
                Date
        )

        SELECT
            Date,
            AVG(daily_total_sales) AS average_sales_per_day
        FROM
            daily_sales
        GROUP BY
            Date
        ORDER BY
            Date;
    `;
    try {
        const { rows } = await base.query(query, [localisation]);
        res.json(rows);
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

app.get('/total-sales-monthly-emp', async (req, res) => {
    const { localisation } = req.query; // Extract the localisation from the query parameters
  
    try {
      // Calculate total sales for the specific localisation in the current month
      const result = await base.query(`
        SELECT 
          SUM(v.Total) AS total_sales
        FROM 
          vente v
        WHERE 
          v.codemag = $1 AND
          date_part('month', v.Date) = date_part('month', CURRENT_DATE) AND
          date_part('year', v.Date) = date_part('year', CURRENT_DATE)
      `, [localisation]);
  
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching total sales:', error);
      res.status(500).send('Server error');
    }
  });
  
  
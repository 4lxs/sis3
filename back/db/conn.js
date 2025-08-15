require('dotenv').config();
const mysql = require('mysql2');

// Debug: Log environment variables (remove in production)
console.log('Database Config:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT || 3306,
    database: 'Qcodeigniter'
});

const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT || 3306,
    database: 'Qcodeigniter',
})

conn.connect((err) => {
    if (err) {
        console.log("ERROR: " + err.message);
        return;
    }
    console.log('Connection established');
})


let dataPool = {}

dataPool.authUser = (username, password) => {
    return new Promise((resolve, reject) => {
        conn.query('SELECT * FROM user WHERE username = ? AND password_hash = ?', [username, password], (err, res, fields) => {
            if (err) { return reject(err) }
            return resolve(res)
        })
    })
}

dataPool.registerUser = (username, password) => {
    return new Promise((resolve, reject) => {
        conn.query('INSERT INTO user (username, password_hash) VALUES (?, ?)', [username, password], (err, res) => {
            if (err) { return reject(err) }
            return resolve(res)
        })
    })
}

dataPool.createEvent = (organizer_id, title, sport_id, location, datetime, max_players, skill_level) => {
    return new Promise((resolve, reject) => {
        conn.query(
            'INSERT INTO GameEvent (organizer_id, title, sport, location, datetime, max_players, skill_level) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [organizer_id, title, sport_id, location, datetime, max_players, skill_level],
            (err, res) => {
                if (err) {
                    return reject(err);
                }
                return resolve(res);
            }
        );
    });
}

dataPool.getAllEvents = () => {
    return new Promise((resolve, reject) => {
        conn.query(
            `SELECT e.*, u.username as organizer_name, s.name as sport_name, 
                    COUNT(r.user_id) as current_players
             FROM GameEvent e 
             LEFT JOIN user u ON e.organizer_id = u.id 
             LEFT JOIN Sport s ON e.sport = s.id 
             LEFT JOIN RSVP r ON e.id = r.gameevent_id
             GROUP BY e.id, u.username, s.name
             ORDER BY e.datetime ASC`,
            (err, res) => {
                if (err) {
                    return reject(err);
                }
                return resolve(res);
            }
        );
    });
}

dataPool.getAllSports = () => {
    return new Promise((resolve, reject) => {
        conn.query(
            'SELECT * FROM Sport ORDER BY name ASC',
            (err, res) => {
                if (err) {
                    return reject(err);
                }
                return resolve(res);
            }
        );
    });
}

dataPool.getSportByName = (sportName) => {
    return new Promise((resolve, reject) => {
        conn.query(
            'SELECT * FROM Sport WHERE name = ?',
            [sportName],
            (err, res) => {
                if (err) {
                    return reject(err);
                }
                return resolve(res);
            }
        );
    });
}

dataPool.createSport = (user_id, name) => {
    return new Promise((resolve, reject) => {
        conn.query(
            'INSERT INTO Sport (user_id, name) VALUES (?, ?)',
            [user_id, name],
            (err, res) => {
                if (err) {
                    return reject(err);
                }
                return resolve(res);
            }
        );
    });
}

module.exports = dataPool;
// --- Comments Feature ---
// Get all comments for a game
dataPool.getCommentsForGame = (gameId) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT c.id, u.username AS user, c.text, c.sent_at as created_at FROM ChatMessage c JOIN user u ON c.user_id = u.id WHERE c.game_event_id = ? ORDER BY c.sent_at ASC`;
        conn.query(sql, [gameId], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

// Add a comment to a game
dataPool.addCommentToGame = (gameId, userId, username, text) => {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO ChatMessage (game_event_id, user_id, text, sent_at) VALUES (?, ?, ?, NOW())`;
        conn.query(sql, [gameId, userId, text], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

// Join a game (RSVP)
dataPool.joinGame = (gameId, userId) => {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO RSVP (gameevent_id, user_id) VALUES (?, ?)`;
        conn.query(sql, [gameId, userId], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

// Leave a game (remove RSVP)
dataPool.leaveGame = (gameId, userId) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM RSVP WHERE gameevent_id = ? AND user_id = ?`;
        conn.query(sql, [gameId, userId], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

// Check if user has joined a game
dataPool.hasUserJoinedGame = (gameId, userId) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM RSVP WHERE gameevent_id = ? AND user_id = ?`;
        conn.query(sql, [gameId, userId], (err, results) => {
            if (err) return reject(err);
            resolve(results.length > 0);
        });
    });
};

// Get games that a user has joined
dataPool.getUserJoinedGames = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT e.*, u.username as organizer_name, s.name as sport_name 
                     FROM GameEvent e 
                     JOIN RSVP r ON e.id = r.gameevent_id 
                     LEFT JOIN user u ON e.organizer_id = u.id 
                     LEFT JOIN Sport s ON e.sport = s.id 
                     WHERE r.user_id = ? 
                     ORDER BY e.datetime ASC`;
        conn.query(sql, [userId], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

// Get RSVP count for a specific game
dataPool.getRSVPCount = (gameId) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT COUNT(*) as count FROM RSVP WHERE gameevent_id = ?`;
        conn.query(sql, [gameId], (err, results) => {
            if (err) return reject(err);
            resolve(results[0].count);
        });
    });
};
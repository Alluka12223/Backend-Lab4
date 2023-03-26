const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(':memory:')
let allUsersInDB = [];

function init() {
  db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS Users (userID TEXT, name TEXT, role TEXT password TEXT)')
    const stmt = db.prepare('INSERT INTO Users VALUES (?,?,?,?)')
    stmt.run(`id1`, `user1`, `student`, `pass`)
    stmt.run(`id2`, `user2`, `student`, `pass`)
    stmt.run(`id3`, `user3`, `teacher`, `pass`)
    stmt.run(`admin`, `admin`, `admin`, `pass`)
    stmt.finalize()
  })
}

module.exports = { init };

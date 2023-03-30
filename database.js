const sqlite3 = require('sqlite3').verbose()
let allUsersInDB = [];

//connect to the database
const db = new sqlite3.Database("./users.db", (err) => {
  if (err) {
    console.log(err.message);
  }
  console.log("connected to library db in sqlite");
});

function insertUserData(req, encryptedPass) {
  const stmt1 = db.prepare('INSERT INTO USERS (name, role, password) VALUES (?,?,?)')
  stmt1.run( `${req.body.name}`, `${req.body.role}`, `${encryptedPass}`)
  console.log('Data entered into database', req.body.name, req.body.password, req.body.role);
}

function getDataFromDB() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * From USERS`, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
}

function checkUser(name) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * From USERS WHERE name=?`, [name], (err, result) => {
      if (err) reject(err)
      else resolve(result.length>0)
    })
  })
}

  
function getUser(username) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM USERS WHERE name LIKE ?", [username], (err, row) => {
      if (err) {
        console.log(err);
        reject(err)
      }
      else {
        resolve(row)
      }
    })
  })
}


module.exports = { insertUserData , getDataFromDB, checkUser, getUser};

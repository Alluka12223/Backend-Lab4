const express = require("express")
const app = express()
const db = require('./database.js')
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')
const cookieParser = require("cookie-parser")
require('dotenv').config()

app.set('view-engine', 'ejs')
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

var key = ""
var pass = ""

app.get('/', (req, res) => {
  res.redirect('/identify')
})

app.get('/admin', authorizeToken, authorizeRole(['admin']), async (req, res) => {
  const table = await db.getDataFromDB();
  res.render('admin.ejs', { users: table })
})

app.get('/register', (req, res) => {
  res.render('register.ejs')
})

app.get('/identify', (req, res) => {
  res.render('identify.ejs')
})

app.get("/start", authorizeToken, authorizeRole(['student', 'teacher', 'admin']), (req, res) => {
  res.render("start.ejs")
})

app.get("/student1", authorizeToken, authorizeRole(["student", "teacher", "admin"]), async (req, res) => {
  const token = req.cookies.jwt
  const decryptedToken = jwt.verify(token, process.env.TOKEN)
  let user = await db.getUser(decryptedToken.name)
  if (user[0].name === 'student1') {
    res.render("student1.ejs", { User: user[0] })
  } else {
    res.sendStatus(401).render('fail.ejs')
  }
})

app.get("/student2", authorizeToken, authorizeRole(["student", "teacher", "admin"]), async (req, res) => {
  const token = req.cookies.jwt
  const decryptedToken = jwt.verify(token, process.env.TOKEN)
  let user = await db.getUser(decryptedToken.name)
  if (user[0].name === 'student2') {
    res.render("student2.ejs", { User: user[0] })
  } else {
    res.status(401).render('fail.ejs')
  }
})

app.get("/teacher", authorizeToken, authorizeRole(['teacher', 'admin']), async (req, res) => {
  res.render("teacher.ejs")
})

app.get("/student", authorizeToken, authorizeRole(['student', 'teacher', 'admin']), async (req, res) => {
  res.render("student.ejs")
})

app.post('/register', async (req, res) => {
  const nameExist = await db.checkUser(req.body.name);
  if (!nameExist) {
    try {
      dbEncryption = await bcrypt.hash(req.body.password, 10)
      db.insertUserData(req, dbEncryption)
      console.log('Username "' + req.body.name + '" sucessfully registered with password:', dbEncryption);
    } catch (error) {
      console.log(error);
    }
  } else {
    console.log('Username exists');
  }
  req.method = "GET"
  res.redirect('/identify')
})

app.post('/identify', async (req, res) => {
  const { name, password } = req.body
  let userExist = await db.checkUser(name)
  if (userExist) {
    let user = await db.getUser(name)
    try {
      if (await bcrypt.compare(password, user[0].password)) {
        const userObj = { userID: user[0].userID, name: user[0].name, role: user[0].role }
        const token = jwt.sign(userObj, process.env.TOKEN)
        const cookieOptions = {
          httpOnly: true, // Set cookie to httpOnly it can only be accessed by the server and not by client-side scripts. 
          maxAge: 86400000 // Set cookie to expire after 1 day (in milliseconds)
        };

        res.cookie("jwt", token, cookieOptions);

        req.method = "GET"
        res.redirect(`/start`)
      } else {
        res.status(401).render("fail.ejs")
      }
    } catch (error) {
      res.status(401).render("fail.ejs")
      console.log('error inside trycatch', error);
    }
  } else {
    res.status(401).render("fail.ejs")
    console.log('no user found!!');
  }
})

async function getUserFromToken(req) {
  const token = req.cookies.jwt
  const decryptedToken = jwt.verify(token, process.env.TOKEN)
  let user = await db.getUser(decryptedToken.name)
  return user[0]
}

function authorizeRole(requiredRoles) {
  return async (req, res, next) => {
    try {
      const user = await getUserFromToken(req)
      if (requiredRoles.includes(user.role)) {
        next()
      } else {
        res.status(401).redirect("/identify")
      }
    }
    catch (error) {
      console.log(error)
      res.status(401).redirect("/identify")
    }
  }
}

function authorizeToken(req, res, next) {
  const token = req.cookies.jwt
  if (!token) {
    return res.status(401).redirect("/identify");
  }
  try {
    const decodedToken = jwt.verify(token, process.env.TOKEN);
    req.user = decodedToken;
    next();

  } catch (error) {
    console.log(error);
    return res.status(403).redirect("/identify");
  }
}

app.get("/users/:userID", authorizeToken, async (req, res) => {
  const token = req.cookies.jwt
  const decryptedToken = jwt.verify(token, process.env.TOKEN)
  let user = await db.getUser(decryptedToken.name)
  user = user[0]
  try {
    if (user.userID != req.params.userID) {
      res.render('fail.ejs')
    }
    else if (user.role === 'admin' || user.role === 'teacher' || (user.role == 'student' && user.name == 'student1')) {
      res.render('student1.ejs', { User: user })
    } else if (user.role === 'admin' || user.role === 'teacher' || (user.role == 'student' && user.name != 'student1')) {
      res.render('student2.ejs', { User: user })
    } else if (user.role === 'admin' || user.role === 'teacher') {
      res.render('teacher.ejs')
    } else if (user.role === 'admin') {
      res.render('admin.ejs')
    }
  } catch (error) {
    console.log(error);
  }
})

app.all("*", (req, res) => { res.status(404).render("error.ejs") })

app.listen(8000, async () => {
  console.log("Server listening on PORT " + 8000)
})
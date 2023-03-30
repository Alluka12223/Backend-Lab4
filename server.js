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

app.get("/student1", async (req, res) => {
  res.render("student1.ejs")
})

app.get("/student2", async (req, res) => {
  res.render("student2.ejs")
})

app.get("/teacher", authorizeToken, authorizeRole(['teacher','admin']), async (req, res) => {
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
  // console.log('pass', password);
  let userExist = await db.checkUser(name)
  if (userExist) {
    let user = await db.getUser(name)
    // console.log('user:', user[0].password);
    try {
      if (await bcrypt.compare(password, user[0].password)) {
        console.log('true in compare');
        const userObj = { userID: user[0].userID, name: user[0].name, role: user[0].role}
        const token = jwt.sign(userObj, process.env.TOKEN)
        // console.log('token', process.env.TOKEN);
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
  // console.log('dectoken', decryptedToken);
  let user = await db.getUser(decryptedToken.name)
  // console.log('user from token', user[0]);
  return user[0]
}

function authorizeRole(requiredRoles) {
  return async (req, res, next) => {
    try {
      const user = await getUserFromToken(req)
      // console.log('role user', user);
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
  console.log('token1', token);
  if (!token) {
    return res.status(401).redirect("/identify");
  }
  try {
    const decodedToken = jwt.verify(token, process.env.TOKEN);
    // console.log('auth', decodedToken);
    req.user = decodedToken;
    // console.log('req user', req.user);
    next();

  } catch (error) {
    console.log(error);
    // 403 - forbidden
    return res.status(403).redirect("/identify");
  }
}

// TODO: logout

app.listen(8000)
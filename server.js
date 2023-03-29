const express = require("express")
const app = express()
const db = require('./database.js')
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')
require('dotenv').config()

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

var key = ""
var pass = ""

app.get('/', (req, res) => {
  res.redirect('/identify')
})


app.post('/identify', (req, res) => {
  const name = req.body.password
  const token = jwt.sign(name, process.env.TOKEN)
  key = token
  pass = name
  res.redirect('/granted')
})


app.get('/identify', (req, res) => {
  res.render('identify.ejs')
})

function authenticationToken(req, res, next) {
  if (key == "") {
    res.redirect('/identify')
    console.log('ahhhhhhh');
  } else if (jwt.verify(key, process.env.TOKEN)) {
    next()
  } else {
    res.redirect('/identify')
  }
}

app.get('/granted', authenticationToken, (req, res) => {
  res.render('start.ejs')
})

// //////////////////////////////////////////////////
app.get('/admin', async (req, res) => {
  const table = await db.getDataFromDB();
  res.render('admin.ejs', {users: table})
})

app.get('/register', (req, res) => {
  res.render('register.ejs')
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

app.listen(8000)
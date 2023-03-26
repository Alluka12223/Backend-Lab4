const express = require("express")
const app = express()
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
app.get('/admin', (req, res) => {
  res.render('admin.ejs')
})

app.listen(8000)
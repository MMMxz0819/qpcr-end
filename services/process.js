var fs = require('fs')

function 
let x = []
let y = []

// read contents of the file
const data = fs.readFileSync('../txt/1.txt', 'UTF-8')

// split the contents by new line
const lines = data.split(/\r?\n/)

// print all lines
lines.forEach((line) => {
  const each = line.split(',')
  x.push(each[0])
  y.push(each[1])
})

console.log(x, y)

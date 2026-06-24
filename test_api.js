const http = require('http')

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/colaboradores',
  method: 'GET',
  headers: {
    // I don't have a token here, but let's see what it returns without one
  }
}, (res) => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', data))
})
req.end()

const http = require('http')

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/debug',
  method: 'GET'
}, (res) => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    console.log('Status:', res.statusCode)
    console.log('Body:', data)
  })
})
req.end()

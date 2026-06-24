const http = require('http')

const postData = JSON.stringify({ email: 'ribeeiro4@gmail.com', senha: 'senha123' })

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    console.log('Login Status:', res.statusCode)
    const cookies = res.headers['set-cookie']
    console.log('Cookies:', cookies)
    if (cookies) {
      const cookieStr = cookies[0].split(';')[0]
      const req2 = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/colaboradores',
        method: 'GET',
        headers: {
          'Cookie': cookieStr
        }
      }, (res2) => {
        let data2 = ''
        res2.on('data', chunk => data2 += chunk)
        res2.on('end', () => {
          console.log('Colaboradores Status:', res2.statusCode)
          console.log('Colaboradores Body:', data2)
        })
      })
      req2.end()
    }
  })
})
req.write(postData)
req.end()

const { run } = require('runjs')
const chalk = require('chalk')
const config = require('../vue.config.js')
const rawArgv = process.argv.slice(2)
const args = rawArgv.join(' ')

if (process.env.npm_config_preview || rawArgv.includes('--preview')) {
  const report = rawArgv.includes('--report')

  run(`vue-cli-service build ${args}`)

  const port = 9528
  const publicPath = config.publicPath

  var connect = require('connect')
  var serveStatic = require('serve-static')
  var httpProxy = require('http-proxy-middleware')
  const app = connect()

  // API 代理配置
  const baseUrl = 'http://localhost:8080'
  const apiProxy = httpProxy.createProxyMiddleware({
    target: baseUrl,
    changeOrigin: true,
    pathRewrite: {
      '^/prod-api': ''
    }
  })

  // 代理 API 请求到后端服务器
  app.use('/prod-api', apiProxy)

  app.use(
    publicPath,
    serveStatic('./dist', {
      index: ['index.html', '/']
    })
  )

  // 处理 Vue Router history 模式的路由
  app.use((req, res, next) => {
    // 如果请求的是静态文件或 API，则跳过
    if (req.url.includes('.') || req.url.startsWith('/prod-api')) {
      return next()
    }
    // 否则返回 index.html
    res.writeHead(200, {'Content-Type': 'text/html'})
    res.end(require('fs').readFileSync('./dist/index.html', 'utf8'))
  })

  app.listen(port, function () {
    console.log(chalk.green(`> Preview at  http://localhost:${port}${publicPath}`))
    if (report) {
      console.log(chalk.green(`> Report at  http://localhost:${port}${publicPath}report.html`))
    }
    // 注意：移除了自动打开浏览器功能以避免 Windows 系统错误
    console.log(chalk.yellow('> 请手动打开浏览器访问上述地址'))
  })
} else {
  run(`vue-cli-service build ${args}`)
}

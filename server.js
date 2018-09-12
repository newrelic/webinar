require('@newrelic/koa');
const newrelic = require('newrelic');
const Koa = require('koa');
const Router = require('koa-router');

const app = new Koa();
const router = new Router();

router.get('/', (ctx, next) => {
  ctx.body = {
    'status': 'ok'
  };
});

// load build info that was created by the code pipeline
const build = require('./build-info');
router.get('/build', (ctx, next) => {
  ctx.body = build;
});

// 1 in every 10 restarts, make this route slow.
const delay = (Math.random() < 0.1) ? 1000 + Math.random() : 0;
router.get('/sometimesslow', async (ctx, next) => {
  await next();
  return new Promise((resolve) => {
    setTimeout(()=> {
      ctx.body = {
        'status': 'ok, but slow'
      };
      resolve();
    }, delay);
  });
});

// add the build information to all routes as a custom attribute
app.use(async (ctx, next) => {
  newrelic.addCustomAttributes(build);
  await next();
});

app.use(router.routes());

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('listening on %d', port);
});

var fs = require('fs'),
    path = require('path');

window.gui = require('nw.gui');

window.top = window;
window.nw = gui.Window.get();
window.ee = new EventEmitter();

//fixed text.js error on node-webkit
require.nodeRequire = require;

/**
 * require.js 환경 설정
 */
requirejs.config({
  baseUrl: 'js/app',
  waitSeconds: 30,
  locale: 'ko-kr',
  paths: {
    tpl: '../../tpl',
    vendors: '../vendors',
    parse: 'core/Parser'
  },
  config: {
    text: {
      env: 'xhr'
    }
  }
});

var lng = global.LOCALES._lang.split('-')[0];
i18n.init({
  lng: lng
}, function() {
  i18n.addResourceBundle(lng, 'menu', global.LOCALES['menu']);
  i18n.setDefaultNamespace('menu');

  MenuBar();

  requirejs.onError = function (e) {
    console.log(e.stack)
    alert('Oops! app is crash :-(');
  };

  requirejs([
    // 'db/DB',
    'context/Context',
    'mail/Mailer',
    'file/File',
    'tools/Tools',
    'window/Window',
    'window/WindowManager',
    'utils/UpdateNotifier'
  ], function(/*DB,*/ Context, Mailer, FileMgr, Tools, Window, WindowMgr, Updater) {

    // window.ee.on('change.markdown', function(md, options, cb) {
    //   cb = typeof options === 'function' ? options : cb;
    //   options = typeof options === 'object' ? options : undefined;
      
    //   var html = Parser(md, options);

    global._gaq.init(function(_gaq) {
      _gaq && _gaq.push('haroopad', 'init', '');
    });

    window.ee.on('send.email', function(fileInfo, mailInfo) {
      var child = WindowMgr.actived;
      var Emails = store.get('Emails') || {};
      var addrs = Emails.addrs || [];

      Mailer.setCredential(mailInfo);
      Mailer.send(mailInfo, fileInfo, function(err, response) {

        if (err) {
          child.window.ee.emit('fail.send.email', err);
          return;
        }

        if (mailInfo.remember) {
          addrs.push(mailInfo.to);
          addrs = _.uniq(addrs);

          store.set('Emails', {
            to: mailInfo.to,
            from: mailInfo.from,
            mode: mailInfo.mode,
            addrs: addrs,
            remember: mailInfo.remember
          });
        }

        child.window.ee.emit('sent.email');
      });
    })
    
    var os = getPlatformName();
    gui.App.on('open', function(cmdline) {
      var file;

      switch(os) {
        case 'windows':
          //"z:\Works\haroopad\" --original-process-start-time=1302223754723848
          //"z:\Works\haroopad\" --original-process-start-time=1302223754723848 "z:\Works\filename.ext"
          if (cmdline.split('"').length >= 5) {
            cmdline = cmdline.split('"');
            cmdline.pop();
            
            file = cmdline.pop();
          }
        break;
        case 'mac':
          file = cmdline;
        break;
        case 'linux':
          //--enable-threaded-compositing /home/rhio/Dropbox/HarooPad/촬영-시나리오.md
          cmdline = cmdline.split(' ');
          cmdline.shift();


          file = cmdline.join(' ');
          file = file.replace(global.Manifest['chromium-args'], '').trim();
        break;
      }
      WindowMgr.open(file);
    });

    /* load temporary files */
    FileMgr.loadTemporary();

    //open file with commend line
    if (global.argv._.length > 0) {
      global.argv._.forEach(function(f) {
        var f = path.resolve(process.env.PWD, f);
        var ext = path.extname(f).replace('.', '');
        ext = ext.toLowerCase();

        if (global.mdexts.indexOf(ext) > -1 && fs.existsSync(f)) {
          WindowMgr.open(f, {
            mode: global.argv.mode
          });
        }
      });
    }

    if (WindowMgr.length() < 1) {
      WindowMgr.open();
    }

    //TODO not perfect
    //update check logic
    window.setTimeout(function() {
      window.ee.emit('check.version');
    }, 2000);

  });

});

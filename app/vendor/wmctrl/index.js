var exec = require('child_process').exec;
var Parser = require('simple-parser');
var es = require('event-stream');
var xwininfo = require('xwininfo');

var wmctrl = module.exports = {};


function readable(fn) {
  return es.readable(function() {
    var self = this;
    fn(function(err, data) {
      if(err) self.emit('error', err);
      else data.map(function(item) {
        self.emit('data', item);
      });
      self.emit('end');
    });
  });
}

wmctrl.list = function(cb) {
  // If no callback is passed in, act like a stream
  if(arguments.length === 0) {
    return readable(wmctrl.list.bind(wmctrl));
  }

  exec('wmctrl -l -G -p', function(err, data) {
    if(err) return cb(err, null);
    var hash = {};
    var wnds = data.split('\n').filter(Boolean).map(function(line) {
      console.log('line: ', line);
      var parser = new Parser(line);
      var wnd = {
        id: parser.hex(),
        desktop_number: parser.num(),
        pid: parser.num(),
        x: parser.num(),
        y: parser.num(),
        width: parser.num(),
        height: parser.num(),
        machine_name: parser.string(),
        title: parser.rest()
      };
      hash[wnd.id] = wnd;
      return wnd;
    });

    xwininfo.root(function(err, data) {
      if(err) return cb(err);
      // Decorate our windows with their stack order
      data.forEach(function(item, idx) {
        if(hash[item.id])
          hash[item.id].order = idx;
      });

      cb(null, wnds);
    });
  });
};

wmctrl.desktops = function(cb) {
  if(arguments.length === 0) {
    return readable(wmctrl.desktops.bind(wmctrl));
  }

  exec('wmctrl -d', function(err, data) {
    if(err) return cb(err, null);
    cb(null, data.split('\n').filter(Boolean).map(function(line) {
      var parser = new Parser(line);
      return {
        id: parser.num(),
        current: parser.string() === '*',
        // DG: <geometry>
        geometry: parser.string() && parser.string().split('x').map(Number),
        // VP: <geometry>
        viewport: parser.string() && parser.string().split(',').map(Number),
        name: parser.rest()
      };
    }));
  });
};

wmctrl.activate = function(wnd, cb) {
  // If no arguments, we're streaming
  if(arguments.length === 0) {
    return es.through(function(wnd) {
      var self = this;
      wmctrl.activate(wnd.id, function() {
        self.emit('data', wnd);
      });
    });
  }

  exec('wmctrl -i -a 0x' + wnd.toString(16), function(err, data) {
    cb && cb(err && 'Invalid window id');
  });
};

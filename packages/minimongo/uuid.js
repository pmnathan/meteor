// XXX dups packages/uuid/uuid.js

// LocalCollection.random() -- known good PRNG, replaces Math.random()
// LocalCollection.uuid() -- returns RFC 4122 v4 UUID.

// see http://baagoe.org/en/wiki/Better_random_numbers_for_javascript
// for a full discussion and Alea implementation.

// Copyright (C) 2010 by Johannes Baagøe <baagoe@baagoe.org>
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use, copy,
// modify, merge, publish, distribute, sublicense, and/or sell copies
// of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
// BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
(function() {

var HEX_DIGITS = "0123456789abcdef";
LocalCollection._Alea = function () {
  function Mash() {
    var n = 0xefc8249d;

    var mash = function(data) {
      data = data.toString();
      for (var i = 0; i < data.length; i++) {
        n += data.charCodeAt(i);
        var h = 0.02519603282416938 * n;
        n = h >>> 0;
        h -= n;
        h *= n;
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000; // 2^32
      }
      return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    };

    mash.version = 'Mash 0.9';
    return mash;
  }

  return (function (args) {
    var s0 = 0;
    var s1 = 0;
    var s2 = 0;
    var c = 1;

    if (args.length == 0) {
      args = [+new Date];
    }
    var mash = Mash();
    s0 = mash(' ');
    s1 = mash(' ');
    s2 = mash(' ');

    for (var i = 0; i < args.length; i++) {
      s0 -= mash(args[i]);
      if (s0 < 0) {
        s0 += 1;
      }
      s1 -= mash(args[i]);
      if (s1 < 0) {
        s1 += 1;
      }
      s2 -= mash(args[i]);
      if (s2 < 0) {
        s2 += 1;
      }
    }
    mash = null;

    var random = function() {
      var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
      s0 = s1;
      s1 = s2;
      return s2 = t - (c = t | 0);
    };
    random.uint32 = function() {
      return random() * 0x100000000; // 2^32
    };
    random.fract53 = function() {
      return random() +
        (random() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
    };
    random.version = 'Alea 0.9';
    random.args = args;
    return random;

  } (Array.prototype.slice.call(arguments)));
}

// instantiate RNG.  Heuristically collect entropy from various sources

// client sources
var height = (typeof window !== 'undefined' && window.innerHeight) ||
      (typeof document !== 'undefined' && document.documentElement && document.documentElement.clientHeight) ||
      (typeof document !== 'undefined' && document.body && document.body.clientHeight) ||
      1;

var width = (typeof window !== 'undefined' && window.innerWidth) ||
      (typeof document !== 'undefined' && document.documentElement && document.documentElement.clientWidth) ||
      (typeof document !== 'undefined' && document.body && document.body.clientWidth) ||
      1;

var agent = (typeof navigator !== 'undefined' && navigator.userAgent) || "";

// server sources
var pid = (typeof process !== 'undefined' && process.pid) || 1;

LocalCollection.random = new LocalCollection._Alea([new Date(), height, width, agent, pid, Math.random()]);

LocalCollection._isObjectID = function (str) {
  return str.length === 24 && str.match(/^[0-9a-f]*$/);
};

LocalCollection._ObjectID = function (hexString) {
  //random-based impl of Mongo ObjectID
  var self = this;
  if (hexString) {
    hexString = hexString.toLowerCase();
    if (!LocalCollection._isObjectID(hexString)) {
      throw new Error("Invalid hexidecimal string for creating an ObjectID");
    }
    self.str = hexString;
  } else {
    var digits = [];
    for (var i = 0; i < 24; i++) {
      digits[i] = HEX_DIGITS.substr(Math.floor(LocalCollection.random() * 0x10), 1);
    }
    self.str = digits.join("");
  }
};

LocalCollection._ObjectID.prototype.toString = function () {
  var self = this;
  return "ObjectID(\"" + self.str + "\")";
};

LocalCollection._ObjectID.prototype.equals = function (other) {
  var self = this;
  return self.valueOf() === other.valueOf();
};
LocalCollection._ObjectID.prototype.clone = function () {
  var self = this;
  return new LocalCollection._ObjectID(self.str);
};

LocalCollection._ObjectID.prototype.valueOf = function () { return this.str; };

// RFC 4122 v4 UUID.
LocalCollection.uuid = function () {
  var s = [];
  for (var i = 0; i < 36; i++) {
    s[i] = HEX_DIGITS.substr(Math.floor(LocalCollection.random() * 0x10), 1);
  }
  s[14] = "4";
  s[19] = HEX_DIGITS.substr((parseInt(s[19],16) & 0x3) | 0x8, 1);
  s[8] = s[13] = s[18] = s[23] = "-";

  var uuid = s.join("");
  return uuid;
};

})();

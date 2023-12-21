/**
 * Minified by jsDelivr using Terser v5.10.0.
 * Original file: /npm/bignumber.js@9.0.2/bignumber.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
!(function (e) {
  "use strict";
  var r,
    n = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i,
    t = Math.ceil,
    i = Math.floor,
    o = "[BigNumber Error] ",
    s = o + "Number primitive has more than 15 significant digits: ",
    f = 1e14,
    u = 14,
    l = 9007199254740991,
    c = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13],
    a = 1e7,
    h = 1e9;
  function g(e) {
    var r = 0 | e;
    return e > 0 || e === r ? r : r - 1;
  }
  function p(e) {
    for (var r, n, t = 1, i = e.length, o = e[0] + ""; t < i; ) {
      for (r = e[t++] + "", n = u - r.length; n--; r = "0" + r);
      o += r;
    }
    for (i = o.length; 48 === o.charCodeAt(--i); );
    return o.slice(0, i + 1 || 1);
  }
  function w(e, r) {
    var n,
      t,
      i = e.c,
      o = r.c,
      s = e.s,
      f = r.s,
      u = e.e,
      l = r.e;
    if (!s || !f) return null;
    if (((n = i && !i[0]), (t = o && !o[0]), n || t))
      return n ? (t ? 0 : -f) : s;
    if (s != f) return s;
    if (((n = s < 0), (t = u == l), !i || !o)) return t ? 0 : !i ^ n ? 1 : -1;
    if (!t) return (u > l) ^ n ? 1 : -1;
    for (f = (u = i.length) < (l = o.length) ? u : l, s = 0; s < f; s++)
      if (i[s] != o[s]) return (i[s] > o[s]) ^ n ? 1 : -1;
    return u == l ? 0 : (u > l) ^ n ? 1 : -1;
  }
  function d(e, r, n, t) {
    if (e < r || e > n || e !== i(e))
      throw Error(
        o +
          (t || "Argument") +
          ("number" == typeof e
            ? e < r || e > n
              ? " out of range: "
              : " not an integer: "
            : " not a primitive number: ") +
          String(e)
      );
  }
  function m(e) {
    var r = e.c.length - 1;
    return g(e.e / u) == r && e.c[r] % 2 != 0;
  }
  function v(e, r) {
    return (
      (e.length > 1 ? e.charAt(0) + "." + e.slice(1) : e) +
      (r < 0 ? "e" : "e+") +
      r
    );
  }
  function N(e, r, n) {
    var t, i;
    if (r < 0) {
      for (i = n + "."; ++r; i += n);
      e = i + e;
    } else if (++r > (t = e.length)) {
      for (i = n, r -= t; --r; i += n);
      e += i;
    } else r < t && (e = e.slice(0, r) + "." + e.slice(r));
    return e;
  }
  (r = (function e(r) {
    var O,
      y,
      b,
      E,
      A,
      S,
      R,
      _,
      B,
      D,
      P = (z.prototype = { constructor: z, toString: null, valueOf: null }),
      x = new z(1),
      L = 20,
      U = 4,
      I = -7,
      T = 21,
      C = -1e7,
      M = 1e7,
      G = !1,
      k = 1,
      F = 0,
      q = {
        prefix: "",
        groupSize: 3,
        secondaryGroupSize: 0,
        groupSeparator: ",",
        decimalSeparator: ".",
        fractionGroupSize: 0,
        fractionGroupSeparator: " ",
        suffix: "",
      },
      j = "0123456789abcdefghijklmnopqrstuvwxyz",
      $ = !0;
    function z(e, r) {
      var t,
        o,
        f,
        c,
        a,
        h,
        g,
        p,
        w = this;
      if (!(w instanceof z)) return new z(e, r);
      if (null == r) {
        if (e && !0 === e._isBigNumber)
          return (
            (w.s = e.s),
            void (!e.c || e.e > M
              ? (w.c = w.e = null)
              : e.e < C
              ? (w.c = [(w.e = 0)])
              : ((w.e = e.e), (w.c = e.c.slice())))
          );
        if ((h = "number" == typeof e) && 0 * e == 0) {
          if (((w.s = 1 / e < 0 ? ((e = -e), -1) : 1), e === ~~e)) {
            for (c = 0, a = e; a >= 10; a /= 10, c++);
            return void (c > M ? (w.c = w.e = null) : ((w.e = c), (w.c = [e])));
          }
          p = String(e);
        } else {
          if (!n.test((p = String(e)))) return b(w, p, h);
          w.s = 45 == p.charCodeAt(0) ? ((p = p.slice(1)), -1) : 1;
        }
        (c = p.indexOf(".")) > -1 && (p = p.replace(".", "")),
          (a = p.search(/e/i)) > 0
            ? (c < 0 && (c = a),
              (c += +p.slice(a + 1)),
              (p = p.substring(0, a)))
            : c < 0 && (c = p.length);
      } else {
        if ((d(r, 2, j.length, "Base"), 10 == r && $))
          return X((w = new z(e)), L + w.e + 1, U);
        if (((p = String(e)), (h = "number" == typeof e))) {
          if (0 * e != 0) return b(w, p, h, r);
          if (
            ((w.s = 1 / e < 0 ? ((p = p.slice(1)), -1) : 1),
            z.DEBUG && p.replace(/^0\.0*|\./, "").length > 15)
          )
            throw Error(s + e);
        } else w.s = 45 === p.charCodeAt(0) ? ((p = p.slice(1)), -1) : 1;
        for (t = j.slice(0, r), c = a = 0, g = p.length; a < g; a++)
          if (t.indexOf((o = p.charAt(a))) < 0) {
            if ("." == o) {
              if (a > c) {
                c = g;
                continue;
              }
            } else if (
              !f &&
              ((p == p.toUpperCase() && (p = p.toLowerCase())) ||
                (p == p.toLowerCase() && (p = p.toUpperCase())))
            ) {
              (f = !0), (a = -1), (c = 0);
              continue;
            }
            return b(w, String(e), h, r);
          }
        (h = !1),
          (c = (p = y(p, r, 10, w.s)).indexOf(".")) > -1
            ? (p = p.replace(".", ""))
            : (c = p.length);
      }
      for (a = 0; 48 === p.charCodeAt(a); a++);
      for (g = p.length; 48 === p.charCodeAt(--g); );
      if ((p = p.slice(a, ++g))) {
        if (((g -= a), h && z.DEBUG && g > 15 && (e > l || e !== i(e))))
          throw Error(s + w.s * e);
        if ((c = c - a - 1) > M) w.c = w.e = null;
        else if (c < C) w.c = [(w.e = 0)];
        else {
          if (
            ((w.e = c), (w.c = []), (a = (c + 1) % u), c < 0 && (a += u), a < g)
          ) {
            for (a && w.c.push(+p.slice(0, a)), g -= u; a < g; )
              w.c.push(+p.slice(a, (a += u)));
            a = u - (p = p.slice(a)).length;
          } else a -= g;
          for (; a--; p += "0");
          w.c.push(+p);
        }
      } else w.c = [(w.e = 0)];
    }
    function H(e, r, n, t) {
      var i, o, s, f, u;
      if ((null == n ? (n = U) : d(n, 0, 8), !e.c)) return e.toString();
      if (((i = e.c[0]), (s = e.e), null == r))
        (u = p(e.c)),
          (u =
            1 == t || (2 == t && (s <= I || s >= T)) ? v(u, s) : N(u, s, "0"));
      else if (
        ((o = (e = X(new z(e), r, n)).e),
        (f = (u = p(e.c)).length),
        1 == t || (2 == t && (r <= o || o <= I)))
      ) {
        for (; f < r; u += "0", f++);
        u = v(u, o);
      } else if (((r -= s), (u = N(u, o, "0")), o + 1 > f)) {
        if (--r > 0) for (u += "."; r--; u += "0");
      } else if ((r += o - f) > 0)
        for (o + 1 == f && (u += "."); r--; u += "0");
      return e.s < 0 && i ? "-" + u : u;
    }
    function V(e, r) {
      for (var n, t = 1, i = new z(e[0]); t < e.length; t++) {
        if (!(n = new z(e[t])).s) {
          i = n;
          break;
        }
        r.call(i, n) && (i = n);
      }
      return i;
    }
    function W(e, r, n) {
      for (var t = 1, i = r.length; !r[--i]; r.pop());
      for (i = r[0]; i >= 10; i /= 10, t++);
      return (
        (n = t + n * u - 1) > M
          ? (e.c = e.e = null)
          : n < C
          ? (e.c = [(e.e = 0)])
          : ((e.e = n), (e.c = r)),
        e
      );
    }
    function X(e, r, n, o) {
      var s,
        l,
        a,
        h,
        g,
        p,
        w,
        d = e.c,
        m = c;
      if (d) {
        e: {
          for (s = 1, h = d[0]; h >= 10; h /= 10, s++);
          if ((l = r - s) < 0)
            (l += u), (a = r), (w = ((g = d[(p = 0)]) / m[s - a - 1]) % 10 | 0);
          else if ((p = t((l + 1) / u)) >= d.length) {
            if (!o) break e;
            for (; d.length <= p; d.push(0));
            (g = w = 0), (s = 1), (a = (l %= u) - u + 1);
          } else {
            for (g = h = d[p], s = 1; h >= 10; h /= 10, s++);
            w = (a = (l %= u) - u + s) < 0 ? 0 : (g / m[s - a - 1]) % 10 | 0;
          }
          if (
            ((o =
              o || r < 0 || null != d[p + 1] || (a < 0 ? g : g % m[s - a - 1])),
            (o =
              n < 4
                ? (w || o) && (0 == n || n == (e.s < 0 ? 3 : 2))
                : w > 5 ||
                  (5 == w &&
                    (4 == n ||
                      o ||
                      (6 == n &&
                        (l > 0 ? (a > 0 ? g / m[s - a] : 0) : d[p - 1]) % 10 &
                          1) ||
                      n == (e.s < 0 ? 8 : 7)))),
            r < 1 || !d[0])
          )
            return (
              (d.length = 0),
              o
                ? ((r -= e.e + 1),
                  (d[0] = m[(u - (r % u)) % u]),
                  (e.e = -r || 0))
                : (d[0] = e.e = 0),
              e
            );
          if (
            (0 == l
              ? ((d.length = p), (h = 1), p--)
              : ((d.length = p + 1),
                (h = m[u - l]),
                (d[p] = a > 0 ? i((g / m[s - a]) % m[a]) * h : 0)),
            o)
          )
            for (;;) {
              if (0 == p) {
                for (l = 1, a = d[0]; a >= 10; a /= 10, l++);
                for (a = d[0] += h, h = 1; a >= 10; a /= 10, h++);
                l != h && (e.e++, d[0] == f && (d[0] = 1));
                break;
              }
              if (((d[p] += h), d[p] != f)) break;
              (d[p--] = 0), (h = 1);
            }
          for (l = d.length; 0 === d[--l]; d.pop());
        }
        e.e > M ? (e.c = e.e = null) : e.e < C && (e.c = [(e.e = 0)]);
      }
      return e;
    }
    function Y(e) {
      var r,
        n = e.e;
      return null === n
        ? e.toString()
        : ((r = p(e.c)),
          (r = n <= I || n >= T ? v(r, n) : N(r, n, "0")),
          e.s < 0 ? "-" + r : r);
    }
    return (
      (z.clone = e),
      (z.ROUND_UP = 0),
      (z.ROUND_DOWN = 1),
      (z.ROUND_CEIL = 2),
      (z.ROUND_FLOOR = 3),
      (z.ROUND_HALF_UP = 4),
      (z.ROUND_HALF_DOWN = 5),
      (z.ROUND_HALF_EVEN = 6),
      (z.ROUND_HALF_CEIL = 7),
      (z.ROUND_HALF_FLOOR = 8),
      (z.EUCLID = 9),
      (z.config = z.set =
        function (e) {
          var r, n;
          if (null != e) {
            if ("object" != typeof e) throw Error(o + "Object expected: " + e);
            if (
              (e.hasOwnProperty((r = "DECIMAL_PLACES")) &&
                (d((n = e[r]), 0, h, r), (L = n)),
              e.hasOwnProperty((r = "ROUNDING_MODE")) &&
                (d((n = e[r]), 0, 8, r), (U = n)),
              e.hasOwnProperty((r = "EXPONENTIAL_AT")) &&
                ((n = e[r]) && n.pop
                  ? (d(n[0], -h, 0, r),
                    d(n[1], 0, h, r),
                    (I = n[0]),
                    (T = n[1]))
                  : (d(n, -h, h, r), (I = -(T = n < 0 ? -n : n)))),
              e.hasOwnProperty((r = "RANGE")))
            )
              if ((n = e[r]) && n.pop)
                d(n[0], -h, -1, r), d(n[1], 1, h, r), (C = n[0]), (M = n[1]);
              else {
                if ((d(n, -h, h, r), !n))
                  throw Error(o + r + " cannot be zero: " + n);
                C = -(M = n < 0 ? -n : n);
              }
            if (e.hasOwnProperty((r = "CRYPTO"))) {
              if ((n = e[r]) !== !!n)
                throw Error(o + r + " not true or false: " + n);
              if (n) {
                if (
                  "undefined" == typeof crypto ||
                  !crypto ||
                  (!crypto.getRandomValues && !crypto.randomBytes)
                )
                  throw ((G = !n), Error(o + "crypto unavailable"));
                G = n;
              } else G = n;
            }
            if (
              (e.hasOwnProperty((r = "MODULO_MODE")) &&
                (d((n = e[r]), 0, 9, r), (k = n)),
              e.hasOwnProperty((r = "POW_PRECISION")) &&
                (d((n = e[r]), 0, h, r), (F = n)),
              e.hasOwnProperty((r = "FORMAT")))
            ) {
              if ("object" != typeof (n = e[r]))
                throw Error(o + r + " not an object: " + n);
              q = n;
            }
            if (e.hasOwnProperty((r = "ALPHABET"))) {
              if (
                "string" != typeof (n = e[r]) ||
                /^.?$|[+\-.\s]|(.).*\1/.test(n)
              )
                throw Error(o + r + " invalid: " + n);
              ($ = "0123456789" == n.slice(0, 10)), (j = n);
            }
          }
          return {
            DECIMAL_PLACES: L,
            ROUNDING_MODE: U,
            EXPONENTIAL_AT: [I, T],
            RANGE: [C, M],
            CRYPTO: G,
            MODULO_MODE: k,
            POW_PRECISION: F,
            FORMAT: q,
            ALPHABET: j,
          };
        }),
      (z.isBigNumber = function (e) {
        if (!e || !0 !== e._isBigNumber) return !1;
        if (!z.DEBUG) return !0;
        var r,
          n,
          t = e.c,
          s = e.e,
          l = e.s;
        e: if ("[object Array]" == {}.toString.call(t)) {
          if ((1 === l || -1 === l) && s >= -h && s <= h && s === i(s)) {
            if (0 === t[0]) {
              if (0 === s && 1 === t.length) return !0;
              break e;
            }
            if (((r = (s + 1) % u) < 1 && (r += u), String(t[0]).length == r)) {
              for (r = 0; r < t.length; r++)
                if ((n = t[r]) < 0 || n >= f || n !== i(n)) break e;
              if (0 !== n) return !0;
            }
          }
        } else if (
          null === t &&
          null === s &&
          (null === l || 1 === l || -1 === l)
        )
          return !0;
        throw Error(o + "Invalid BigNumber: " + e);
      }),
      (z.maximum = z.max =
        function () {
          return V(arguments, P.lt);
        }),
      (z.minimum = z.min =
        function () {
          return V(arguments, P.gt);
        }),
      (z.random =
        ((E = 9007199254740992),
        (A =
          (Math.random() * E) & 2097151
            ? function () {
                return i(Math.random() * E);
              }
            : function () {
                return (
                  8388608 * ((1073741824 * Math.random()) | 0) +
                  ((8388608 * Math.random()) | 0)
                );
              }),
        function (e) {
          var r,
            n,
            s,
            f,
            l,
            a = 0,
            g = [],
            p = new z(x);
          if ((null == e ? (e = L) : d(e, 0, h), (f = t(e / u)), G))
            if (crypto.getRandomValues) {
              for (
                r = crypto.getRandomValues(new Uint32Array((f *= 2)));
                a < f;

              )
                (l = 131072 * r[a] + (r[a + 1] >>> 11)) >= 9e15
                  ? ((n = crypto.getRandomValues(new Uint32Array(2))),
                    (r[a] = n[0]),
                    (r[a + 1] = n[1]))
                  : (g.push(l % 1e14), (a += 2));
              a = f / 2;
            } else {
              if (!crypto.randomBytes)
                throw ((G = !1), Error(o + "crypto unavailable"));
              for (r = crypto.randomBytes((f *= 7)); a < f; )
                (l =
                  281474976710656 * (31 & r[a]) +
                  1099511627776 * r[a + 1] +
                  4294967296 * r[a + 2] +
                  16777216 * r[a + 3] +
                  (r[a + 4] << 16) +
                  (r[a + 5] << 8) +
                  r[a + 6]) >= 9e15
                  ? crypto.randomBytes(7).copy(r, a)
                  : (g.push(l % 1e14), (a += 7));
              a = f / 7;
            }
          if (!G) for (; a < f; ) (l = A()) < 9e15 && (g[a++] = l % 1e14);
          for (
            f = g[--a],
              e %= u,
              f && e && ((l = c[u - e]), (g[a] = i(f / l) * l));
            0 === g[a];
            g.pop(), a--
          );
          if (a < 0) g = [(s = 0)];
          else {
            for (s = -1; 0 === g[0]; g.splice(0, 1), s -= u);
            for (a = 1, l = g[0]; l >= 10; l /= 10, a++);
            a < u && (s -= u - a);
          }
          return (p.e = s), (p.c = g), p;
        })),
      (z.sum = function () {
        for (var e = 1, r = arguments, n = new z(r[0]); e < r.length; )
          n = n.plus(r[e++]);
        return n;
      }),
      (y = (function () {
        var e = "0123456789";
        function r(e, r, n, t) {
          for (var i, o, s = [0], f = 0, u = e.length; f < u; ) {
            for (o = s.length; o--; s[o] *= r);
            for (s[0] += t.indexOf(e.charAt(f++)), i = 0; i < s.length; i++)
              s[i] > n - 1 &&
                (null == s[i + 1] && (s[i + 1] = 0),
                (s[i + 1] += (s[i] / n) | 0),
                (s[i] %= n));
          }
          return s.reverse();
        }
        return function (n, t, i, o, s) {
          var f,
            u,
            l,
            c,
            a,
            h,
            g,
            w,
            d = n.indexOf("."),
            m = L,
            v = U;
          for (
            d >= 0 &&
              ((c = F),
              (F = 0),
              (n = n.replace(".", "")),
              (h = (w = new z(t)).pow(n.length - d)),
              (F = c),
              (w.c = r(N(p(h.c), h.e, "0"), 10, i, e)),
              (w.e = w.c.length)),
              l = c = (g = r(n, t, i, s ? ((f = j), e) : ((f = e), j))).length;
            0 == g[--c];
            g.pop()
          );
          if (!g[0]) return f.charAt(0);
          if (
            (d < 0
              ? --l
              : ((h.c = g),
                (h.e = l),
                (h.s = o),
                (g = (h = O(h, w, m, v, i)).c),
                (a = h.r),
                (l = h.e)),
            (d = g[(u = l + m + 1)]),
            (c = i / 2),
            (a = a || u < 0 || null != g[u + 1]),
            (a =
              v < 4
                ? (null != d || a) && (0 == v || v == (h.s < 0 ? 3 : 2))
                : d > c ||
                  (d == c &&
                    (4 == v ||
                      a ||
                      (6 == v && 1 & g[u - 1]) ||
                      v == (h.s < 0 ? 8 : 7)))),
            u < 1 || !g[0])
          )
            n = a ? N(f.charAt(1), -m, f.charAt(0)) : f.charAt(0);
          else {
            if (((g.length = u), a))
              for (--i; ++g[--u] > i; )
                (g[u] = 0), u || (++l, (g = [1].concat(g)));
            for (c = g.length; !g[--c]; );
            for (d = 0, n = ""; d <= c; n += f.charAt(g[d++]));
            n = N(n, l, f.charAt(0));
          }
          return n;
        };
      })()),
      (O = (function () {
        function e(e, r, n) {
          var t,
            i,
            o,
            s,
            f = 0,
            u = e.length,
            l = r % a,
            c = (r / a) | 0;
          for (e = e.slice(); u--; )
            (f =
              (((i =
                l * (o = e[u] % a) +
                ((t = c * o + (s = (e[u] / a) | 0) * l) % a) * a +
                f) /
                n) |
                0) +
              ((t / a) | 0) +
              c * s),
              (e[u] = i % n);
          return f && (e = [f].concat(e)), e;
        }
        function r(e, r, n, t) {
          var i, o;
          if (n != t) o = n > t ? 1 : -1;
          else
            for (i = o = 0; i < n; i++)
              if (e[i] != r[i]) {
                o = e[i] > r[i] ? 1 : -1;
                break;
              }
          return o;
        }
        function n(e, r, n, t) {
          for (var i = 0; n--; )
            (e[n] -= i),
              (i = e[n] < r[n] ? 1 : 0),
              (e[n] = i * t + e[n] - r[n]);
          for (; !e[0] && e.length > 1; e.splice(0, 1));
        }
        return function (t, o, s, l, c) {
          var a,
            h,
            p,
            w,
            d,
            m,
            v,
            N,
            O,
            y,
            b,
            E,
            A,
            S,
            R,
            _,
            B,
            D = t.s == o.s ? 1 : -1,
            P = t.c,
            x = o.c;
          if (!(P && P[0] && x && x[0]))
            return new z(
              t.s && o.s && (P ? !x || P[0] != x[0] : x)
                ? (P && 0 == P[0]) || !x
                  ? 0 * D
                  : D / 0
                : NaN
            );
          for (
            O = (N = new z(D)).c = [],
              D = s + (h = t.e - o.e) + 1,
              c || ((c = f), (h = g(t.e / u) - g(o.e / u)), (D = (D / u) | 0)),
              p = 0;
            x[p] == (P[p] || 0);
            p++
          );
          if ((x[p] > (P[p] || 0) && h--, D < 0)) O.push(1), (w = !0);
          else {
            for (
              S = P.length,
                _ = x.length,
                p = 0,
                D += 2,
                (d = i(c / (x[0] + 1))) > 1 &&
                  ((x = e(x, d, c)),
                  (P = e(P, d, c)),
                  (_ = x.length),
                  (S = P.length)),
                A = _,
                b = (y = P.slice(0, _)).length;
              b < _;
              y[b++] = 0
            );
            (B = x.slice()),
              (B = [0].concat(B)),
              (R = x[0]),
              x[1] >= c / 2 && R++;
            do {
              if (((d = 0), (a = r(x, y, _, b)) < 0)) {
                if (
                  ((E = y[0]),
                  _ != b && (E = E * c + (y[1] || 0)),
                  (d = i(E / R)) > 1)
                )
                  for (
                    d >= c && (d = c - 1),
                      v = (m = e(x, d, c)).length,
                      b = y.length;
                    1 == r(m, y, v, b);

                  )
                    d--, n(m, _ < v ? B : x, v, c), (v = m.length), (a = 1);
                else 0 == d && (a = d = 1), (v = (m = x.slice()).length);
                if (
                  (v < b && (m = [0].concat(m)),
                  n(y, m, b, c),
                  (b = y.length),
                  -1 == a)
                )
                  for (; r(x, y, _, b) < 1; )
                    d++, n(y, _ < b ? B : x, b, c), (b = y.length);
              } else 0 === a && (d++, (y = [0]));
              (O[p++] = d),
                y[0] ? (y[b++] = P[A] || 0) : ((y = [P[A]]), (b = 1));
            } while ((A++ < S || null != y[0]) && D--);
            (w = null != y[0]), O[0] || O.splice(0, 1);
          }
          if (c == f) {
            for (p = 1, D = O[0]; D >= 10; D /= 10, p++);
            X(N, s + (N.e = p + h * u - 1) + 1, l, w);
          } else (N.e = h), (N.r = +w);
          return N;
        };
      })()),
      (S = /^(-?)0([xbo])(?=\w[\w.]*$)/i),
      (R = /^([^.]+)\.$/),
      (_ = /^\.([^.]+)$/),
      (B = /^-?(Infinity|NaN)$/),
      (D = /^\s*\+(?=[\w.])|^\s+|\s+$/g),
      (b = function (e, r, n, t) {
        var i,
          s = n ? r : r.replace(D, "");
        if (B.test(s)) e.s = isNaN(s) ? null : s < 0 ? -1 : 1;
        else {
          if (
            !n &&
            ((s = s.replace(S, function (e, r, n) {
              return (
                (i = "x" == (n = n.toLowerCase()) ? 16 : "b" == n ? 2 : 8),
                t && t != i ? e : r
              );
            })),
            t && ((i = t), (s = s.replace(R, "$1").replace(_, "0.$1"))),
            r != s)
          )
            return new z(s, i);
          if (z.DEBUG)
            throw Error(
              o + "Not a" + (t ? " base " + t : "") + " number: " + r
            );
          e.s = null;
        }
        e.c = e.e = null;
      }),
      (P.absoluteValue = P.abs =
        function () {
          var e = new z(this);
          return e.s < 0 && (e.s = 1), e;
        }),
      (P.comparedTo = function (e, r) {
        return w(this, new z(e, r));
      }),
      (P.decimalPlaces = P.dp =
        function (e, r) {
          var n,
            t,
            i,
            o = this;
          if (null != e)
            return (
              d(e, 0, h),
              null == r ? (r = U) : d(r, 0, 8),
              X(new z(o), e + o.e + 1, r)
            );
          if (!(n = o.c)) return null;
          if (((t = ((i = n.length - 1) - g(this.e / u)) * u), (i = n[i])))
            for (; i % 10 == 0; i /= 10, t--);
          return t < 0 && (t = 0), t;
        }),
      (P.dividedBy = P.div =
        function (e, r) {
          return O(this, new z(e, r), L, U);
        }),
      (P.dividedToIntegerBy = P.idiv =
        function (e, r) {
          return O(this, new z(e, r), 0, 1);
        }),
      (P.exponentiatedBy = P.pow =
        function (e, r) {
          var n,
            s,
            f,
            l,
            c,
            a,
            h,
            g,
            p = this;
          if ((e = new z(e)).c && !e.isInteger())
            throw Error(o + "Exponent not an integer: " + Y(e));
          if (
            (null != r && (r = new z(r)),
            (c = e.e > 14),
            !p.c ||
              !p.c[0] ||
              (1 == p.c[0] && !p.e && 1 == p.c.length) ||
              !e.c ||
              !e.c[0])
          )
            return (
              (g = new z(Math.pow(+Y(p), c ? 2 - m(e) : +Y(e)))),
              r ? g.mod(r) : g
            );
          if (((a = e.s < 0), r)) {
            if (r.c ? !r.c[0] : !r.s) return new z(NaN);
            (s = !a && p.isInteger() && r.isInteger()) && (p = p.mod(r));
          } else {
            if (
              e.e > 9 &&
              (p.e > 0 ||
                p.e < -1 ||
                (0 == p.e
                  ? p.c[0] > 1 || (c && p.c[1] >= 24e7)
                  : p.c[0] < 8e13 || (c && p.c[0] <= 9999975e7)))
            )
              return (
                (l = p.s < 0 && m(e) ? -0 : 0),
                p.e > -1 && (l = 1 / l),
                new z(a ? 1 / l : l)
              );
            F && (l = t(F / u + 2));
          }
          for (
            c
              ? ((n = new z(0.5)), a && (e.s = 1), (h = m(e)))
              : (h = (f = Math.abs(+Y(e))) % 2),
              g = new z(x);
            ;

          ) {
            if (h) {
              if (!(g = g.times(p)).c) break;
              l ? g.c.length > l && (g.c.length = l) : s && (g = g.mod(r));
            }
            if (f) {
              if (0 === (f = i(f / 2))) break;
              h = f % 2;
            } else if ((X((e = e.times(n)), e.e + 1, 1), e.e > 14)) h = m(e);
            else {
              if (0 === (f = +Y(e))) break;
              h = f % 2;
            }
            (p = p.times(p)),
              l
                ? p.c && p.c.length > l && (p.c.length = l)
                : s && (p = p.mod(r));
          }
          return s
            ? g
            : (a && (g = x.div(g)),
              r ? g.mod(r) : l ? X(g, F, U, undefined) : g);
        }),
      (P.integerValue = function (e) {
        var r = new z(this);
        return null == e ? (e = U) : d(e, 0, 8), X(r, r.e + 1, e);
      }),
      (P.isEqualTo = P.eq =
        function (e, r) {
          return 0 === w(this, new z(e, r));
        }),
      (P.isFinite = function () {
        return !!this.c;
      }),
      (P.isGreaterThan = P.gt =
        function (e, r) {
          return w(this, new z(e, r)) > 0;
        }),
      (P.isGreaterThanOrEqualTo = P.gte =
        function (e, r) {
          return 1 === (r = w(this, new z(e, r))) || 0 === r;
        }),
      (P.isInteger = function () {
        return !!this.c && g(this.e / u) > this.c.length - 2;
      }),
      (P.isLessThan = P.lt =
        function (e, r) {
          return w(this, new z(e, r)) < 0;
        }),
      (P.isLessThanOrEqualTo = P.lte =
        function (e, r) {
          return -1 === (r = w(this, new z(e, r))) || 0 === r;
        }),
      (P.isNaN = function () {
        return !this.s;
      }),
      (P.isNegative = function () {
        return this.s < 0;
      }),
      (P.isPositive = function () {
        return this.s > 0;
      }),
      (P.isZero = function () {
        return !!this.c && 0 == this.c[0];
      }),
      (P.minus = function (e, r) {
        var n,
          t,
          i,
          o,
          s = this,
          l = s.s;
        if (((r = (e = new z(e, r)).s), !l || !r)) return new z(NaN);
        if (l != r) return (e.s = -r), s.plus(e);
        var c = s.e / u,
          a = e.e / u,
          h = s.c,
          p = e.c;
        if (!c || !a) {
          if (!h || !p) return h ? ((e.s = -r), e) : new z(p ? s : NaN);
          if (!h[0] || !p[0])
            return p[0] ? ((e.s = -r), e) : new z(h[0] ? s : 3 == U ? -0 : 0);
        }
        if (((c = g(c)), (a = g(a)), (h = h.slice()), (l = c - a))) {
          for (
            (o = l < 0) ? ((l = -l), (i = h)) : ((a = c), (i = p)),
              i.reverse(),
              r = l;
            r--;
            i.push(0)
          );
          i.reverse();
        } else
          for (
            t = (o = (l = h.length) < (r = p.length)) ? l : r, l = r = 0;
            r < t;
            r++
          )
            if (h[r] != p[r]) {
              o = h[r] < p[r];
              break;
            }
        if (
          (o && ((i = h), (h = p), (p = i), (e.s = -e.s)),
          (r = (t = p.length) - (n = h.length)) > 0)
        )
          for (; r--; h[n++] = 0);
        for (r = f - 1; t > l; ) {
          if (h[--t] < p[t]) {
            for (n = t; n && !h[--n]; h[n] = r);
            --h[n], (h[t] += f);
          }
          h[t] -= p[t];
        }
        for (; 0 == h[0]; h.splice(0, 1), --a);
        return h[0]
          ? W(e, h, a)
          : ((e.s = 3 == U ? -1 : 1), (e.c = [(e.e = 0)]), e);
      }),
      (P.modulo = P.mod =
        function (e, r) {
          var n,
            t,
            i = this;
          return (
            (e = new z(e, r)),
            !i.c || !e.s || (e.c && !e.c[0])
              ? new z(NaN)
              : !e.c || (i.c && !i.c[0])
              ? new z(i)
              : (9 == k
                  ? ((t = e.s),
                    (e.s = 1),
                    (n = O(i, e, 0, 3)),
                    (e.s = t),
                    (n.s *= t))
                  : (n = O(i, e, 0, k)),
                (e = i.minus(n.times(e))).c[0] || 1 != k || (e.s = i.s),
                e)
          );
        }),
      (P.multipliedBy = P.times =
        function (e, r) {
          var n,
            t,
            i,
            o,
            s,
            l,
            c,
            h,
            p,
            w,
            d,
            m,
            v,
            N,
            O,
            y = this,
            b = y.c,
            E = (e = new z(e, r)).c;
          if (!(b && E && b[0] && E[0]))
            return (
              !y.s || !e.s || (b && !b[0] && !E) || (E && !E[0] && !b)
                ? (e.c = e.e = e.s = null)
                : ((e.s *= y.s),
                  b && E ? ((e.c = [0]), (e.e = 0)) : (e.c = e.e = null)),
              e
            );
          for (
            t = g(y.e / u) + g(e.e / u),
              e.s *= y.s,
              (c = b.length) < (w = E.length) &&
                ((v = b), (b = E), (E = v), (i = c), (c = w), (w = i)),
              i = c + w,
              v = [];
            i--;
            v.push(0)
          );
          for (N = f, O = a, i = w; --i >= 0; ) {
            for (
              n = 0, d = E[i] % O, m = (E[i] / O) | 0, o = i + (s = c);
              o > i;

            )
              (n =
                (((h =
                  d * (h = b[--s] % O) +
                  ((l = m * h + (p = (b[s] / O) | 0) * d) % O) * O +
                  v[o] +
                  n) /
                  N) |
                  0) +
                ((l / O) | 0) +
                m * p),
                (v[o--] = h % N);
            v[o] = n;
          }
          return n ? ++t : v.splice(0, 1), W(e, v, t);
        }),
      (P.negated = function () {
        var e = new z(this);
        return (e.s = -e.s || null), e;
      }),
      (P.plus = function (e, r) {
        var n,
          t = this,
          i = t.s;
        if (((r = (e = new z(e, r)).s), !i || !r)) return new z(NaN);
        if (i != r) return (e.s = -r), t.minus(e);
        var o = t.e / u,
          s = e.e / u,
          l = t.c,
          c = e.c;
        if (!o || !s) {
          if (!l || !c) return new z(i / 0);
          if (!l[0] || !c[0]) return c[0] ? e : new z(l[0] ? t : 0 * i);
        }
        if (((o = g(o)), (s = g(s)), (l = l.slice()), (i = o - s))) {
          for (
            i > 0 ? ((s = o), (n = c)) : ((i = -i), (n = l)), n.reverse();
            i--;
            n.push(0)
          );
          n.reverse();
        }
        for (
          (i = l.length) - (r = c.length) < 0 &&
            ((n = c), (c = l), (l = n), (r = i)),
            i = 0;
          r;

        )
          (i = ((l[--r] = l[r] + c[r] + i) / f) | 0),
            (l[r] = f === l[r] ? 0 : l[r] % f);
        return i && ((l = [i].concat(l)), ++s), W(e, l, s);
      }),
      (P.precision = P.sd =
        function (e, r) {
          var n,
            t,
            i,
            o = this;
          if (null != e && e !== !!e)
            return (
              d(e, 1, h), null == r ? (r = U) : d(r, 0, 8), X(new z(o), e, r)
            );
          if (!(n = o.c)) return null;
          if (((t = (i = n.length - 1) * u + 1), (i = n[i]))) {
            for (; i % 10 == 0; i /= 10, t--);
            for (i = n[0]; i >= 10; i /= 10, t++);
          }
          return e && o.e + 1 > t && (t = o.e + 1), t;
        }),
      (P.shiftedBy = function (e) {
        return d(e, -9007199254740991, l), this.times("1e" + e);
      }),
      (P.squareRoot = P.sqrt =
        function () {
          var e,
            r,
            n,
            t,
            i,
            o = this,
            s = o.c,
            f = o.s,
            u = o.e,
            l = L + 4,
            c = new z("0.5");
          if (1 !== f || !s || !s[0])
            return new z(!f || (f < 0 && (!s || s[0])) ? NaN : s ? o : 1 / 0);
          if (
            (0 == (f = Math.sqrt(+Y(o))) || f == 1 / 0
              ? (((r = p(s)).length + u) % 2 == 0 && (r += "0"),
                (f = Math.sqrt(+r)),
                (u = g((u + 1) / 2) - (u < 0 || u % 2)),
                (n = new z(
                  (r =
                    f == 1 / 0
                      ? "5e" + u
                      : (r = f.toExponential()).slice(0, r.indexOf("e") + 1) +
                        u)
                )))
              : (n = new z(f + "")),
            n.c[0])
          )
            for ((f = (u = n.e) + l) < 3 && (f = 0); ; )
              if (
                ((i = n),
                (n = c.times(i.plus(O(o, i, l, 1)))),
                p(i.c).slice(0, f) === (r = p(n.c)).slice(0, f))
              ) {
                if (
                  (n.e < u && --f,
                  "9999" != (r = r.slice(f - 3, f + 1)) && (t || "4999" != r))
                ) {
                  (+r && (+r.slice(1) || "5" != r.charAt(0))) ||
                    (X(n, n.e + L + 2, 1), (e = !n.times(n).eq(o)));
                  break;
                }
                if (!t && (X(i, i.e + L + 2, 0), i.times(i).eq(o))) {
                  n = i;
                  break;
                }
                (l += 4), (f += 4), (t = 1);
              }
          return X(n, n.e + L + 1, U, e);
        }),
      (P.toExponential = function (e, r) {
        return null != e && (d(e, 0, h), e++), H(this, e, r, 1);
      }),
      (P.toFixed = function (e, r) {
        return null != e && (d(e, 0, h), (e = e + this.e + 1)), H(this, e, r);
      }),
      (P.toFormat = function (e, r, n) {
        var t,
          i = this;
        if (null == n)
          null != e && r && "object" == typeof r
            ? ((n = r), (r = null))
            : e && "object" == typeof e
            ? ((n = e), (e = r = null))
            : (n = q);
        else if ("object" != typeof n)
          throw Error(o + "Argument not an object: " + n);
        if (((t = i.toFixed(e, r)), i.c)) {
          var s,
            f = t.split("."),
            u = +n.groupSize,
            l = +n.secondaryGroupSize,
            c = n.groupSeparator || "",
            a = f[0],
            h = f[1],
            g = i.s < 0,
            p = g ? a.slice(1) : a,
            w = p.length;
          if ((l && ((s = u), (u = l), (l = s), (w -= s)), u > 0 && w > 0)) {
            for (s = w % u || u, a = p.substr(0, s); s < w; s += u)
              a += c + p.substr(s, u);
            l > 0 && (a += c + p.slice(s)), g && (a = "-" + a);
          }
          t = h
            ? a +
              (n.decimalSeparator || "") +
              ((l = +n.fractionGroupSize)
                ? h.replace(
                    new RegExp("\\d{" + l + "}\\B", "g"),
                    "$&" + (n.fractionGroupSeparator || "")
                  )
                : h)
            : a;
        }
        return (n.prefix || "") + t + (n.suffix || "");
      }),
      (P.toFraction = function (e) {
        var r,
          n,
          t,
          i,
          s,
          f,
          l,
          a,
          h,
          g,
          w,
          d,
          m = this,
          v = m.c;
        if (
          null != e &&
          ((!(l = new z(e)).isInteger() && (l.c || 1 !== l.s)) || l.lt(x))
        )
          throw Error(
            o +
              "Argument " +
              (l.isInteger() ? "out of range: " : "not an integer: ") +
              Y(l)
          );
        if (!v) return new z(m);
        for (
          r = new z(x),
            h = n = new z(x),
            t = a = new z(x),
            d = p(v),
            s = r.e = d.length - m.e - 1,
            r.c[0] = c[(f = s % u) < 0 ? u + f : f],
            e = !e || l.comparedTo(r) > 0 ? (s > 0 ? r : h) : l,
            f = M,
            M = 1 / 0,
            l = new z(d),
            a.c[0] = 0;
          (g = O(l, r, 0, 1)), 1 != (i = n.plus(g.times(t))).comparedTo(e);

        )
          (n = t),
            (t = i),
            (h = a.plus(g.times((i = h)))),
            (a = i),
            (r = l.minus(g.times((i = r)))),
            (l = i);
        return (
          (i = O(e.minus(n), t, 0, 1)),
          (a = a.plus(i.times(h))),
          (n = n.plus(i.times(t))),
          (a.s = h.s = m.s),
          (w =
            O(h, t, (s *= 2), U)
              .minus(m)
              .abs()
              .comparedTo(O(a, n, s, U).minus(m).abs()) < 1
              ? [h, t]
              : [a, n]),
          (M = f),
          w
        );
      }),
      (P.toNumber = function () {
        return +Y(this);
      }),
      (P.toPrecision = function (e, r) {
        return null != e && d(e, 1, h), H(this, e, r, 2);
      }),
      (P.toString = function (e) {
        var r,
          n = this,
          t = n.s,
          i = n.e;
        return (
          null === i
            ? t
              ? ((r = "Infinity"), t < 0 && (r = "-" + r))
              : (r = "NaN")
            : (null == e
                ? (r = i <= I || i >= T ? v(p(n.c), i) : N(p(n.c), i, "0"))
                : 10 === e && $
                ? (r = N(p((n = X(new z(n), L + i + 1, U)).c), n.e, "0"))
                : (d(e, 2, j.length, "Base"),
                  (r = y(N(p(n.c), i, "0"), 10, e, t, !0))),
              t < 0 && n.c[0] && (r = "-" + r)),
          r
        );
      }),
      (P.valueOf = P.toJSON =
        function () {
          return Y(this);
        }),
      (P._isBigNumber = !0),
      null != r && z.set(r),
      z
    );
  })()),
    (r.default = r.BigNumber = r),
    "function" == typeof define && define.amd
      ? define(function () {
          return r;
        })
      : "undefined" != typeof module && module.exports
      ? (module.exports = r)
      : (e || (e = "undefined" != typeof self && self ? self : window),
        (e.BigNumber = r));
})(this);
//# sourceMappingURL=/sm/4dda16a2c1b3eb172f77b1ddc34dde3d5a15827e9f21702886e993b84dc6645c.map

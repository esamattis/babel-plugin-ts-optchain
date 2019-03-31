"use strict";

var _runtime = require("../src/runtime");

/**
 * Copyright (C) 2018-present, Rimeto, LLC.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
describe("ts-optchain", () => {
  it("sanity checks", () => {
    const x = {
      a: "hello",
      b: {
        d: "world"
      },
      c: [-100, 200, -300],
      d: null,
      e: {
        f: false
      }
    };
    expect((0, _runtime.oc)(x, ["a"])).toEqual("hello");
    expect((0, _runtime.oc)(x, ["b", "d"])).toEqual("world");
    expect((0, _runtime.oc)(x, ["c", 0])).toEqual(-100);
    expect((0, _runtime.oc)(x, ["c", 100])).toBeUndefined();
    expect((0, _runtime.oc)(x, ["c", 100], 1234)).toEqual(1234);
    expect((0, _runtime.oc)(x, ["d", "e"])).toBeUndefined();
    expect((0, _runtime.oc)(x, ["d", "e"], "optional default value")).toEqual("optional default value");
    expect((0, _runtime.oc)(x, ["e", "f"])).toEqual(false);
    expect((0, _runtime.oc)(x, ["y", "z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"])).toBeUndefined();
  });
  it("optional chaining equivalence", () => {
    const x = {
      a: "hello",
      b: {
        d: "world"
      },
      c: [{
        u: {
          v: -100
        }
      }, {
        u: {
          v: 200
        }
      }, {}, {
        u: {
          v: -300
        }
      }]
    };
    expect((0, _runtime.oc)(x, ["a"])).toEqual(x.a);
    expect((0, _runtime.oc)(x, ["b", "d"])).toEqual(x.b && x.b.d);
    expect((0, _runtime.oc)(x, ["c", 0, "u", "v"])).toEqual(x.c && x.c[0] && x.c[0].u && x.c[0].u.v);
    expect((0, _runtime.oc)(x, ["c", 100, "u", "v"])).toEqual(x.c && x.c[100] && x.c[100].u && x.c[100].u.v);
    expect((0, _runtime.oc)(x, ["c", 100, "u", "v"], 1234)).toEqual(x.c && x.c[100] && x.c[100].u && x.c[100].u.v || 1234);
    expect((0, _runtime.oc)(x, ["e", "f"])).toEqual(x.e && x.e.f);
    expect((0, _runtime.oc)(x, ["e", "f"], "optional default value")).toEqual(x.e && x.e.f || "optional default value");
    expect((0, _runtime.oc)(x, ["e", "g"], () => "Yo Yo")()).toEqual((x.e && x.e.g || (() => "Yo Yo"))());
  });
});

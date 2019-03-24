import {oc} from "../src/runtime";

test("runtime oc can access path", () => {
    const data = {
        foo: 1,
    };

    expect(oc(data, ["foo"])).toEqual(1);
});

test("runtime oc handles missing data", () => {
    const data = {
        foo: 1,
    };

    expect(oc(data, ["foo", "bar"])).toBeUndefined();
});

test("runtime oc can have default", () => {
    const data = {
        foo: 1,
    };

    expect(oc(data, ["foo", "bar"], "default")).toBe("default");
});

test("runtime oc defaults handles falsy values", () => {
    const data = {
        foo: {
            bar: 0,
        },
    };

    expect(oc(data, ["foo", "bar"], "default")).toBe(0);
});

import test from "node:test";
import assert from "node:assert/strict";
import { amountsMatch, receiversMatch } from "../app/api/payments/verify-receipt/_lib/helpers";

test("amountsMatch accepts equal and above expected amounts", () => {
  assert.equal(amountsMatch(100, 100), true);
  assert.equal(amountsMatch(100, 100.01), true);
  assert.equal(amountsMatch(100, 140), true);
});

test("amountsMatch rejects below-expected amounts", () => {
  assert.equal(amountsMatch(100, 99.98), false);
  assert.equal(amountsMatch(100, 90), false);
});

test("receiversMatch accepts full and suffix digit matches", () => {
  assert.equal(receiversMatch("1000323143777", "1000323143777"), true);
  assert.equal(receiversMatch("1000323143777", "1****3777"), true);
  assert.equal(receiversMatch("1000323143777", "E****3777"), true);
});

test("receiversMatch rejects different receiver tails", () => {
  assert.equal(receiversMatch("1000323143777", "E****0910"), false);
});

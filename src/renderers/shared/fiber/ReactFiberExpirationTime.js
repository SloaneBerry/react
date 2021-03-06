/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactFiberExpirationTime
 * @flow
 */

'use strict';

// TODO: Use an opaque type once ESLint et al support the syntax
export type ExpirationTime = number;

const NoWork = 0;
const Sync = 1;
const Task = 2;
const Never = 2147483647; // Max int32: Math.pow(2, 31) - 1

const UNIT_SIZE = 10;
const MAGIC_NUMBER_OFFSET = 3;

exports.Sync = Sync;
exports.Task = Task;
exports.NoWork = NoWork;
exports.Never = Never;

// 1 unit of expiration time represents 10ms.
function msToExpirationTime(ms: number): ExpirationTime {
  // Always add an offset so that we don't clash with the magic number for NoWork.
  return ((ms / UNIT_SIZE) | 0) + MAGIC_NUMBER_OFFSET;
}
exports.msToExpirationTime = msToExpirationTime;

function ceiling(num: number, precision: number): number {
  return (((((num * precision) | 0) + 1) / precision) | 0) + 1;
}

function bucket(
  currentTime: ExpirationTime,
  expirationInMs: number,
  precisionInMs: number,
): ExpirationTime {
  return ceiling(
    currentTime + expirationInMs / UNIT_SIZE,
    precisionInMs / UNIT_SIZE,
  );
}

// Given the current clock time, returns an expiration time. We use rounding
// to batch like updates together.
function asyncExpirationTime(currentTime: ExpirationTime) {
  // Should complete within ~1000ms. 1200ms max.
  return bucket(currentTime, 1000, 200);
}
exports.asyncExpirationTime = asyncExpirationTime;

// Given the current clock time and an expiration time, returns the
// relative expiration time. Possible values include NoWork, Sync, Task, and
// Never. All other values represent an async expiration time.
function relativeExpirationTime(
  currentTime: ExpirationTime,
  expirationTime: ExpirationTime,
): ExpirationTime {
  switch (expirationTime) {
    case NoWork:
    case Sync:
    case Task:
    case Never:
      return expirationTime;
  }
  const delta = expirationTime - currentTime;
  if (delta <= 0) {
    return Task;
  }
  return msToExpirationTime(delta);
}
exports.relativeExpirationTime = relativeExpirationTime;

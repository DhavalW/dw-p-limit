"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pLimit = pLimit;
exports.withRetry = withRetry;
function pLimit(concurrency, options) {
    var _this = this;
    if (options === void 0) { options = {}; }
    if (!(concurrency >= 1)) {
        throw new Error('Concurrency must be >= 1');
    }
    var queue = [];
    var activeCount = 0;
    var executeWithRetry = function (fn, retryOptions) { return __awaiter(_this, void 0, void 0, function () {
        var _a, retries, _b, initialDelay, _c, maxDelay, _d, backoffFactor, lastError, delay, attempt, error_1;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (!retryOptions) {
                        return [2 /*return*/, fn()];
                    }
                    _a = retryOptions.retries, retries = _a === void 0 ? 3 : _a, _b = retryOptions.initialDelay, initialDelay = _b === void 0 ? 1000 : _b, _c = retryOptions.maxDelay, maxDelay = _c === void 0 ? 30000 : _c, _d = retryOptions.backoffFactor, backoffFactor = _d === void 0 ? 2 : _d;
                    if (retries === 0) {
                        return [2 /*return*/, fn()];
                    }
                    delay = initialDelay;
                    attempt = 0;
                    _e.label = 1;
                case 1:
                    if (!(attempt <= retries)) return [3 /*break*/, 7];
                    _e.label = 2;
                case 2:
                    _e.trys.push([2, 4, , 6]);
                    return [4 /*yield*/, fn()];
                case 3: return [2 /*return*/, _e.sent()];
                case 4:
                    error_1 = _e.sent();
                    lastError = error_1;
                    if (attempt === retries) {
                        throw lastError;
                    }
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay); })];
                case 5:
                    _e.sent();
                    delay = Math.min(delay * backoffFactor, maxDelay);
                    return [3 /*break*/, 6];
                case 6:
                    attempt++;
                    return [3 /*break*/, 1];
                case 7: throw lastError;
            }
        });
    }); };
    var next = function () {
        if (activeCount >= concurrency || queue.length === 0) {
            return;
        }
        var _a = queue.shift(), fn = _a.fn, resolve = _a.resolve, reject = _a.reject, retryOptions = _a.retryOptions;
        activeCount++;
        Promise.resolve()
            .then(function () { return executeWithRetry(fn, retryOptions); })
            .then(resolve)
            .catch(reject)
            .finally(function () {
            activeCount--;
            next();
        });
    };
    return function (fn, retryOptions) {
        return new Promise(function (resolve, reject) {
            queue.push({
                fn: fn,
                resolve: resolve,
                reject: reject,
                retryOptions: retryOptions || options.retry
            });
            next();
        });
    };
}
function withRetry(fn, options) {
    var _this = this;
    if (options === void 0) { options = {}; }
    var _a = options.retries, retries = _a === void 0 ? 3 : _a, _b = options.initialDelay, initialDelay = _b === void 0 ? 1000 : _b, _c = options.maxDelay, maxDelay = _c === void 0 ? 30000 : _c, _d = options.backoffFactor, backoffFactor = _d === void 0 ? 2 : _d;
    return function () { return __awaiter(_this, void 0, void 0, function () {
        var lastError, delay, attempt, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    delay = initialDelay;
                    attempt = 0;
                    _a.label = 1;
                case 1:
                    if (!(attempt <= retries)) return [3 /*break*/, 7];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 6]);
                    return [4 /*yield*/, fn()];
                case 3: return [2 /*return*/, _a.sent()];
                case 4:
                    error_2 = _a.sent();
                    lastError = error_2;
                    if (attempt === retries) {
                        throw lastError;
                    }
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay); })];
                case 5:
                    _a.sent();
                    delay = Math.min(delay * backoffFactor, maxDelay);
                    return [3 /*break*/, 6];
                case 6:
                    attempt++;
                    return [3 /*break*/, 1];
                case 7: throw lastError;
            }
        });
    }); };
}

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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./src/index");
// Function to simulate an API call with a possibility of failure
var fetchData = function (id_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([id_1], args_1, true), void 0, function (id, shouldFail) {
        if (shouldFail === void 0) { shouldFail = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Fetching data for ID: ".concat(id, "..."));
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 1:
                    _a.sent(); // Simulate network delay
                    if (shouldFail) {
                        console.log("Request for ID: ".concat(id, " failed!"));
                        throw new Error("Failed to fetch data for ID: ".concat(id));
                    }
                    console.log("Successfully fetched data for ID: ".concat(id));
                    return [2 /*return*/, { id: id, data: "Data for ".concat(id) }];
            }
        });
    });
};
// Demo the library
function runDemo() {
    return __awaiter(this, void 0, void 0, function () {
        var limit, tasks, _loop_1, i, results1, attempt, retryableTask, result2, limitWithRetry, mixedTasks, results3, error_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('=== BASIC CONCURRENCY LIMITING ===');
                    limit = (0, index_1.pLimit)(2);
                    tasks = [];
                    _loop_1 = function (i) {
                        tasks.push(limit(function () { return fetchData(i); }));
                    };
                    for (i = 1; i <= 5; i++) {
                        _loop_1(i);
                    }
                    return [4 /*yield*/, Promise.all(tasks)];
                case 1:
                    results1 = _a.sent();
                    console.log('Results:', results1);
                    console.log('\n=== RETRY MECHANISM ===');
                    attempt = 0;
                    retryableTask = (0, index_1.withRetry)(function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            attempt++;
                            return [2 /*return*/, fetchData('retry-test', attempt === 1)]; // Fail on first attempt only
                        });
                    }); }, {
                        retries: 3,
                        initialDelay: 500,
                        backoffFactor: 2
                    });
                    return [4 /*yield*/, retryableTask()];
                case 2:
                    result2 = _a.sent();
                    console.log('Retry result:', result2);
                    console.log('\n=== COMBINED FEATURES ===');
                    limitWithRetry = (0, index_1.pLimit)(2, {
                        retry: {
                            retries: 2,
                            initialDelay: 500,
                            backoffFactor: 2,
                            maxDelay: 5000
                        }
                    });
                    mixedTasks = [
                        limitWithRetry(function () { return fetchData('reliable-1'); }),
                        limitWithRetry(function () { return fetchData('unreliable-1', true); }), // This will fail and retry
                        limitWithRetry(function () { return fetchData('reliable-2'); }),
                        limitWithRetry(function () { return fetchData('unreliable-2', true); }) // This will fail and retry
                    ];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, Promise.all(mixedTasks)];
                case 4:
                    results3 = _a.sent();
                    console.log('Mixed results:', results3);
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.error('Some tasks failed even after retries:', error_1 instanceof Error ? error_1.message : String(error_1));
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Run the demo
runDemo().catch(function (err) {
    console.error('Demo failed:', err instanceof Error ? err.message : String(err));
});

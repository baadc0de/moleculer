const ServiceBroker = require("../../../src/service-broker");
const Cacher = require("../../../src/cachers/base");
const Context = require("../../../src/context");


describe("Test BaseCacher", () => {

	it("check constructor", () => {
		let cacher = new Cacher();
		expect(cacher).toBeDefined();
		expect(cacher.opts).toBeDefined();
		expect(cacher.opts.ttl).toBeNull();
		expect(cacher.init).toBeDefined();
		expect(cacher.close).toBeDefined();
		expect(cacher.get).toBeDefined();
		expect(cacher.set).toBeDefined();
		expect(cacher.del).toBeDefined();
		expect(cacher.clean).toBeDefined();
		expect(cacher.getCacheKey).toBeDefined();
		expect(cacher.middleware).toBeDefined();
	});

	it("check constructor with empty opts", () => {
		let opts = {};
		let cacher = new Cacher(opts);
		expect(cacher.opts).toBeDefined();
		expect(cacher.opts.ttl).toBeNull();
		expect(cacher.opts.maxParamsLength).toBeNull();
	});

	it("check constructor with options", () => {
		let opts = { ttl: 500, maxParamsLength: 128 };
		let cacher = new Cacher(opts);
		expect(cacher).toBeDefined();
		expect(cacher.opts).toEqual(opts);
		expect(cacher.opts.ttl).toBe(500);
		expect(cacher.opts.maxParamsLength).toBe(128);
	});

	it("check init", () => {
		let broker = new ServiceBroker({ logger: false });
		broker.on = jest.fn();
		let cacher = new Cacher();

		cacher.init(broker);
		expect(cacher.broker).toBe(broker);
		expect(cacher.logger).toBeDefined();
		expect(cacher.prefix).toBe("MOL-");
	});

	it("check init with namespace", () => {
		let broker = new ServiceBroker({ logger: false, namespace: "uat-test" });
		let cacher = new Cacher();
		cacher.init(broker);

		expect(cacher.prefix).toBe("MOL-uat-test-");
	});

	it("check init with prefix", () => {
		let broker = new ServiceBroker({ logger: false, namespace: "uat-test" });
		let cacher = new Cacher({ prefix: "other" });
		cacher.init(broker);

		expect(cacher.prefix).toBe("other-");
	});


	it("check getCacheKey with keys", () => {
		let broker = new ServiceBroker({ logger: false });
		let cacher = new Cacher();

		cacher.init(broker);
		// Check result
		let res = cacher.getCacheKey("posts.find.model", { id: 1, name: "Bob" });
		expect(res).toBe("posts.find.model:id|1|name|Bob");

		// Same result, with same params
		let res2 = cacher.getCacheKey("posts.find.model", { id: 1, name: "Bob" });
		expect(res2).toEqual(res);

		// Different result, with different params
		let res3 = cacher.getCacheKey("posts.find.model", { id: 2, name: "Bob" });
		expect(res3).not.toEqual(res);
		expect(res3).toBe("posts.find.model:id|2|name|Bob");

		res = cacher.getCacheKey();
		expect(res).toBe(undefined);

		res = cacher.getCacheKey("posts.find");
		expect(res).toBe("posts.find");

		res = cacher.getCacheKey("user", {});
		expect(res).toBe("user:");

		res = cacher.getCacheKey("user", {a: 5});
		expect(res).toBe("user:a|5");

		res = cacher.getCacheKey("user", {a: []});
		expect(res).toBe("user:a|");

		res = cacher.getCacheKey("user", {a: null});
		expect(res).toBe("user:a|null");

		res = cacher.getCacheKey("user", {a: 5}, null, ["a"]);
		expect(res).toBe("user:5");

		res = cacher.getCacheKey("user", {a: { id: 5 }}, null, ["a"]);
		expect(res).toBe("user:id|5");

		res = cacher.getCacheKey("user", { a: [1,3,5] }, null, ["a"]);
		expect(res).toBe("user:1|3|5");

		res = cacher.getCacheKey("user", {a: 5, b: 3, c: 5}, null, ["a"]);
		expect(res).toBe("user:5");

		res = cacher.getCacheKey("user", {a: { b: "John" }}, null, ["a.b"]);
		expect(res).toBe("user:John");

		res = cacher.getCacheKey("user", {a: 5, b: 3, c: 5}, null, ["a", "b", "c"]);
		expect(res).toBe("user:5|3|5");

		res = cacher.getCacheKey("user", {a: 5, c: 5}, null, ["a", "b", "c"]);
		expect(res).toBe("user:5|undefined|5");


		res = cacher.getCacheKey("user", {a: 5, b: { id: 3 }}, null, ["a", "c", "b"]);
		expect(res).toBe("user:5|undefined|id|3");

		res = cacher.getCacheKey("user", {a: 5, b: { id: 3, other: { status: true } }}, null, ["a", "c", "b.id"]);
		expect(res).toBe("user:5|undefined|3");

		res = cacher.getCacheKey("user", {a: 5, b: { id: 3, other: { status: true } }}, null, ["a", "b.id", "b.other.status"]);
		expect(res).toBe("user:5|3|true");

		res = cacher.getCacheKey("user", {a: 5, b: { id: 3, other: { status: true } }});
		expect(res).toBe("user:a|5|b|id|3|other|status|true");

		res = cacher.getCacheKey("user", {a: 5, b: 3}, null, []);
		expect(res).toBe("user");

		res = cacher.getCacheKey("user", {a: Object.create(null)}, null, ["a"]);
		expect(res).toBe("user:");

		// Test with meta
		res = cacher.getCacheKey("user", {a: 5}, { user: "bob" });
		expect(res).toBe("user:a|5");

		res = cacher.getCacheKey("user", {a: 5}, { user: "bob" }, ["a"]);
		expect(res).toBe("user:5");

		res = cacher.getCacheKey("user", {a: 5}, { user: "bob" }, ["user"]);
		expect(res).toBe("user:undefined");

		res = cacher.getCacheKey("user", {a: 5}, { user: "bob" }, ["#user"]);
		expect(res).toBe("user:bob");

		res = cacher.getCacheKey("user", {a: 5}, { user: "bob" }, ["a", "#user"]);
		expect(res).toBe("user:5|bob");

		res = cacher.getCacheKey("user", {a: 5}, { user: "bob" }, ["#user", "a"]);
		expect(res).toBe("user:bob|5");

		res = cacher.getCacheKey("user", {a: 5, user: "adam"}, { user: "bob" }, ["#user"]);
		expect(res).toBe("user:bob");

		res = cacher.getCacheKey("user", {a: 5}, null, ["#user"]);
		expect(res).toBe("user:undefined");

		res = cacher.getCacheKey("user", null, {a: { b: { c: "nested" }}}, ["#a.b.c"]);
		expect(res).toBe("user:nested");
	});

	it("check getCacheKey with hashing", () => {
		let broker = new ServiceBroker({ logger: false });
		let cacher = new Cacher();
		let res;

		cacher.init(broker);

		const bigObj = {"A":{"C0":false,"C1":true,"C2":true,"C3":"495f761d77d6294f","C4":true},"B":{"C0":true,"C1":false,"C2":true,"C3":"5721c26bfddb7927","C4":false},"C":{"C0":"5d9e85c124d5d09e","C1":true,"C2":5366,"C3":false,"C4":false},"D":{"C0":false,"C1":true,"C2":"704473bca1242604","C3":false,"C4":"6fc56107e69be769"},"E":{"C0":true,"C1":true,"C2":4881,"C3":true,"C4":1418},"F":{"C0":true,"C1":false,"C2":false,"C3":false,"C4":true},"G":{"C0":false,"C1":true,"C2":false,"C3":6547,"C4":9565},"H":{"C0":true,"C1":1848,"C2":"232e6552d0b8aa98","C3":"1d50627abe5c0463","C4":5251},"I":{"C0":"ecd0e4eae08e4f","C1":"197bcb312fc17f60","C2":4755,"C3":true,"C4":9552},"J":{"C0":false,"C1":"1cc45cadbbf240f","C2":"4dbb352b21c3c2f3","C3":5065,"C4":"792b19631c78d4f6"},"K":{"C0":"13c23a525adf9e1f","C1":true,"C2":true,"C3":"589d3499abbf6765","C4":true},"L":{"C0":false,"C1":true,"C2":4350,"C3":"72f6c4f0e9beb03c","C4":"434b74b5ff500609"},"M":{"C0":9228,"C1":"5254b36ec238c266","C2":true,"C3":"27b040089b057684","C4":true},"N":{"C0":"35d3c608ef8aac5e","C1":"23fbdbd520d5ae7d","C2":false,"C3":9061,"C4":true},"O":{"C0":true,"C1":true,"C2":"2382f9fe7834e0cc","C3":true,"C4":false},"P":{"C0":true,"C1":false,"C2":"38c0d40b91a9d1f6","C3":false,"C4":5512},"Q":{"C0":true,"C1":true,"C2":true,"C3":true,"C4":true},"R":{"C0":"70bd27c06b067734","C1":true,"C2":"5213493253b98636","C3":8272,"C4":1264},"S":{"C0":"61044125008e634c","C1":9175,"C2":true,"C3":"225e3d912bfbc338","C4":false},"T":{"C0":"38edc77387da030a","C1":false,"C2":"38d8b9e2525413fc","C3":true,"C4":false},"U":{"C0":false,"C1":"4b3962c3d26bddd0","C2":"1e66b069bad46643","C3":3642,"C4":9225},"V":{"C0":"1c40e44b54486080","C1":"5a560d81078bab02","C2":"1c131259e1e9aa61","C3":true,"C4":9335},"W":{"C0":false,"C1":"7089b0ad438df2cb","C2":"216aec98f513ac08","C3":true,"C4":false},"X":{"C0":"3b749354aac19f24","C1":9626,"C2":true,"C3":false,"C4":false},"Y":{"C0":298,"C1":"224075dadd108ef9","C2":3450,"C3":2548,"C4":true}};

		cacher.opts.maxParamsLength = 44;
		res = cacher.getCacheKey("abc.def", bigObj);
		expect(res).toBe("abc.def:/18CtAt7Z+barI7S7Ef+WTFQ23yVQ4VM8o+riN95sjo=");

		cacher.opts.maxParamsLength = 94;
		res = cacher.getCacheKey("abc.def", bigObj);
		expect(res).toBe("abc.def:A|C0|false|C1|true|C2|true|C3|495f761d77d6294f|C4|/18CtAt7Z+barI7S7Ef+WTFQ23yVQ4VM8o+riN95sjo=");

		cacher.opts.maxParamsLength = 485;
		res = cacher.getCacheKey("abc.def", bigObj);
		expect(res).toBe("abc.def:A|C0|false|C1|true|C2|true|C3|495f761d77d6294f|C4|true|B|C0|true|C1|false|C2|true|C3|5721c26bfddb7927|C4|false|C|C0|5d9e85c124d5d09e|C1|true|C2|5366|C3|false|C4|false|D|C0|false|C1|true|C2|704473bca1242604|C3|false|C4|6fc56107e69be769|E|C0|true|C1|true|C2|4881|C3|true|C4|1418|F|C0|true|C1|false|C2|false|C3|false|C4|true|G|C0|false|C1|true|C2|false|C3|6547|C4|9565|H|C0|true|C1|1848|C2|232e6552d0b8aa98|C3|1d50627abe5c0463|C4|5251|I|C0|ecd0/18CtAt7Z+barI7S7Ef+WTFQ23yVQ4VM8o+riN95sjo=");

		cacher.opts.maxParamsLength = null;
		res = cacher.getCacheKey("abc.def", bigObj);
		expect(res).toBe("abc.def:A|C0|false|C1|true|C2|true|C3|495f761d77d6294f|C4|true|B|C0|true|C1|false|C2|true|C3|5721c26bfddb7927|C4|false|C|C0|5d9e85c124d5d09e|C1|true|C2|5366|C3|false|C4|false|D|C0|false|C1|true|C2|704473bca1242604|C3|false|C4|6fc56107e69be769|E|C0|true|C1|true|C2|4881|C3|true|C4|1418|F|C0|true|C1|false|C2|false|C3|false|C4|true|G|C0|false|C1|true|C2|false|C3|6547|C4|9565|H|C0|true|C1|1848|C2|232e6552d0b8aa98|C3|1d50627abe5c0463|C4|5251|I|C0|ecd0e4eae08e4f|C1|197bcb312fc17f60|C2|4755|C3|true|C4|9552|J|C0|false|C1|1cc45cadbbf240f|C2|4dbb352b21c3c2f3|C3|5065|C4|792b19631c78d4f6|K|C0|13c23a525adf9e1f|C1|true|C2|true|C3|589d3499abbf6765|C4|true|L|C0|false|C1|true|C2|4350|C3|72f6c4f0e9beb03c|C4|434b74b5ff500609|M|C0|9228|C1|5254b36ec238c266|C2|true|C3|27b040089b057684|C4|true|N|C0|35d3c608ef8aac5e|C1|23fbdbd520d5ae7d|C2|false|C3|9061|C4|true|O|C0|true|C1|true|C2|2382f9fe7834e0cc|C3|true|C4|false|P|C0|true|C1|false|C2|38c0d40b91a9d1f6|C3|false|C4|5512|Q|C0|true|C1|true|C2|true|C3|true|C4|true|R|C0|70bd27c06b067734|C1|true|C2|5213493253b98636|C3|8272|C4|1264|S|C0|61044125008e634c|C1|9175|C2|true|C3|225e3d912bfbc338|C4|false|T|C0|38edc77387da030a|C1|false|C2|38d8b9e2525413fc|C3|true|C4|false|U|C0|false|C1|4b3962c3d26bddd0|C2|1e66b069bad46643|C3|3642|C4|9225|V|C0|1c40e44b54486080|C1|5a560d81078bab02|C2|1c131259e1e9aa61|C3|true|C4|9335|W|C0|false|C1|7089b0ad438df2cb|C2|216aec98f513ac08|C3|true|C4|false|X|C0|3b749354aac19f24|C1|9626|C2|true|C3|false|C4|false|Y|C0|298|C1|224075dadd108ef9|C2|3450|C3|2548|C4|true");

		cacher.opts.maxParamsLength = 44;
		res = cacher.getCacheKey("users.list", { token: "eyJpZCI6Im9SMU1sS1hCdVVjSGlnM3QiLCJ1c2VybmFtZSI6ImljZWJvYiIsImV4cCI6MTUzNDYyMTk1MCwiaWF0IjoxNTI5NDM3OTUwfQ" }, {}, ["token"]);
		expect(res).toBe("users.list:YUgoMlSXRyzkAI98NgGKRqakaZdCSJiITaRJWHyaJlU=");

		cacher.opts.maxParamsLength = 44;
		res = cacher.getCacheKey("users.list", { id: 123, token: "eyJpZCI6Im9SMU1sS1hCdVVjSGlnM3QiLCJ1c2VybmFtZSI6ImljZWJvYiIsImV4cCI6MTUzNDYyMTk1MCwiaWF0IjoxNTI5NDM3OTUwfQ" }, {}, ["id", "token"]);
		expect(res).toBe("users.list:jVksjHDWP+LfXPCxdnQC9Sa10+12yis9AhWmSOwCWfY=");
	});

	it("check getCacheKey with custom keygen", () => {
		let broker = new ServiceBroker({ logger: false });
		let keygen = jest.fn(() => "custom");
		let cacher = new Cacher({ keygen });

		cacher.init(broker);

		let res = cacher.getCacheKey("posts.find.model", { limit: 5 }, { user: "bob" }, ["limit", "#user"]);
		expect(res).toBe("custom");
		expect(keygen).toHaveBeenCalledTimes(1);
		expect(keygen).toHaveBeenCalledWith("posts.find.model", { limit: 5 }, { user: "bob" }, ["limit", "#user"]);
	});
});

describe("Test middleware", () => {
	let cachedData = { num: 5 };

	let cacher = new Cacher();
	let broker = new ServiceBroker({
		logger: false,
		cacher
	});

	cacher.get = jest.fn(() => Promise.resolve(cachedData)),
	cacher.set = jest.fn();

	let mockAction = {
		name: "posts.find",
		cache: true,
		handler: jest.fn()
	};
	let params = { id: 3, name: "Antsa" };

	it("should give back the cached data and not called the handler", () => {
		let ctx = new Context();
		ctx.setParams(params);

		let cachedHandler = cacher.middleware()(mockAction.handler, mockAction);
		expect(typeof cachedHandler).toBe("function");

		return cachedHandler(ctx).then(response => {
			expect(broker.cacher.get).toHaveBeenCalledTimes(1);
			expect(broker.cacher.get).toHaveBeenCalledWith("posts.find:id|3|name|Antsa");
			expect(mockAction.handler).toHaveBeenCalledTimes(0);
			expect(broker.cacher.set).toHaveBeenCalledTimes(0);
			expect(response).toBe(cachedData);
		});

	});

	it("should not give back cached data and should call the handler and call the 'cache.set' action with promise", () => {
		let resData = [1,3,5];
		let cacheKey = cacher.getCacheKey(mockAction.name, params);
		broker.cacher.get = jest.fn(() => Promise.resolve(null));
		mockAction.handler = jest.fn(() => Promise.resolve(resData));

		let ctx = new Context();
		ctx.setParams(params);

		let cachedHandler = cacher.middleware()(mockAction.handler, mockAction);

		return cachedHandler(ctx).then(response => {
			expect(response).toBe(resData);
			expect(mockAction.handler).toHaveBeenCalledTimes(1);

			expect(broker.cacher.get).toHaveBeenCalledTimes(1);
			expect(broker.cacher.get).toHaveBeenCalledWith(cacheKey);

			expect(broker.cacher.set).toHaveBeenCalledTimes(1);
			expect(broker.cacher.set).toHaveBeenCalledWith(cacheKey, resData, undefined);
		});
	});

	it("should call the 'cache.set' action with custom TTL", () => {
		let resData = [1];
		let cacheKey = cacher.getCacheKey(mockAction.name, params);
		broker.cacher.set.mockClear();
		broker.cacher.get = jest.fn(() => Promise.resolve(null));
		mockAction.handler = jest.fn(() => Promise.resolve(resData));
		mockAction.cache = { ttl: 8 };

		let ctx = new Context();
		ctx.setParams(params);

		let cachedHandler = cacher.middleware()(mockAction.handler, mockAction);

		return cachedHandler(ctx).then(response => {
			expect(response).toBe(resData);
			expect(mockAction.handler).toHaveBeenCalledTimes(1);

			expect(broker.cacher.get).toHaveBeenCalledTimes(1);
			expect(broker.cacher.get).toHaveBeenCalledWith(cacheKey);

			expect(broker.cacher.set).toHaveBeenCalledTimes(1);
			expect(broker.cacher.set).toHaveBeenCalledWith(cacheKey, resData, 8);
		});
	});

	it("should not call cacher.get & set if cache = false", () => {
		let action = {
			name: "posts.get",
			cache: false,
			handler: jest.fn(() => Promise.resolve(cachedData))
		};
		cacher.get.mockClear();
		cacher.set.mockClear();

		let ctx = new Context();
		ctx.setParams(params);

		let cachedHandler = cacher.middleware()(action.handler, action);
		expect(typeof cachedHandler).toBe("function");

		return cachedHandler(ctx).then(() => {
			expect(cachedHandler).toBe(action.handler);
			expect(broker.cacher.get).toHaveBeenCalledTimes(0);
			expect(action.handler).toHaveBeenCalledTimes(1);
			expect(broker.cacher.set).toHaveBeenCalledTimes(0);
		});

	});

});

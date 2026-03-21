import {
  InMemoryRateLimiter,
  RedisRateLimiter,
} from "../../../server/rate-limiter";

type RedisExecResult = Array<[Error | null, unknown]>;

function makeRedisStub(execResult: RedisExecResult) {
  const exec = jest.fn<Promise<RedisExecResult>, []>().mockResolvedValue(execResult);
  const chain = {
    incr: jest.fn().mockReturnThis(),
    pexpire: jest.fn().mockReturnThis(),
    pttl: jest.fn().mockReturnThis(),
    exec,
  };

  return {
    chain,
    client: {
      multi: jest.fn().mockReturnValue(chain),
      quit: jest.fn().mockResolvedValue(undefined),
    },
  };
}

describe("InMemoryRateLimiter", () => {
  it("allows requests up to max and rejects afterwards", async () => {
    const limiter = new InMemoryRateLimiter({ windowMs: 1_000, max: 2 });

    const first = await limiter.check("k");
    const second = await limiter.check("k");
    const third = await limiter.check("k");

    expect(first).toEqual({ ok: true, count: 1 });
    expect(second).toEqual({ ok: true, count: 2 });
    expect(third.ok).toBe(false);
    expect(third.count).toBe(3);
    expect(third.retryAfter).toBeGreaterThanOrEqual(0);
  });

  it("resets the counter after window expiration", async () => {
    const nowSpy = jest.spyOn(Date, "now");
    nowSpy.mockReturnValueOnce(0);
    nowSpy.mockReturnValueOnce(50);
    nowSpy.mockReturnValueOnce(1_001);

    const limiter = new InMemoryRateLimiter({ windowMs: 1_000, max: 1 });
    const first = await limiter.check("window-key");
    const second = await limiter.check("window-key");
    const third = await limiter.check("window-key");

    expect(first).toEqual({ ok: true, count: 1 });
    expect(second.ok).toBe(false);
    expect(third).toEqual({ ok: true, count: 1 });

    nowSpy.mockRestore();
  });

  it("clears internal state on close()", async () => {
    const limiter = new InMemoryRateLimiter({ max: 1 });
    await limiter.check("close-key");
    await limiter.close();

    const afterClose = await limiter.check("close-key");
    expect(afterClose).toEqual({ ok: true, count: 1 });
  });
});

describe("RedisRateLimiter", () => {
  it("returns ok=true when count is within limit", async () => {
    const { client } = makeRedisStub([
      [null, 1],
      [null, "OK"],
      [null, 9_000],
    ]);

    const limiter = new RedisRateLimiter(client, { max: 2, windowMs: 10_000 });
    const result = await limiter.check("abc");

    expect(client.multi).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true, count: 1 });
  });

  it("returns retryAfter when count exceeds max and pttl is negative", async () => {
    const { client } = makeRedisStub([
      [null, 3],
      [null, "OK"],
      [null, -25],
    ]);

    const limiter = new RedisRateLimiter(client, { max: 2, windowMs: 10_000 });
    const result = await limiter.check("abc");

    expect(result).toEqual({ ok: false, count: 3, retryAfter: 0 });
  });

  it("closes redis connection on close()", async () => {
    const { client } = makeRedisStub([
      [null, 1],
      [null, "OK"],
      [null, 5_000],
    ]);

    const limiter = new RedisRateLimiter(client, { max: 2 });
    await limiter.close();
    expect(client.quit).toHaveBeenCalledTimes(1);
  });
});

describe("createRateLimiter", () => {
  const originalRedisUrl = process.env.REDIS_URL;

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    if (originalRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = originalRedisUrl;
    }
  });

  it("returns InMemoryRateLimiter when REDIS_URL is not configured", async () => {
    delete process.env.REDIS_URL;

    await jest.isolateModulesAsync(async () => {
      const { createRateLimiter, InMemoryRateLimiter: InMemoryClass } = await import(
        "../../../server/rate-limiter"
      );
      const limiter = await createRateLimiter();
      expect(limiter).toBeInstanceOf(InMemoryClass);
    });
  });

  it("falls back to InMemoryRateLimiter when ioredis import fails", async () => {
    process.env.REDIS_URL = "redis://localhost:6379";

    await jest.isolateModulesAsync(async () => {
      jest.doMock(
        "ioredis",
        () => {
          throw new Error("ioredis unavailable");
        },
        { virtual: true },
      );

      const { createRateLimiter, InMemoryRateLimiter: InMemoryClass } = await import(
        "../../../server/rate-limiter"
      );
      const limiter = await createRateLimiter({ max: 1 });
      expect(limiter).toBeInstanceOf(InMemoryClass);
    });
  });

  it("returns RedisRateLimiter when ioredis is available", async () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    const { client } = makeRedisStub([
      [null, 1],
      [null, "OK"],
      [null, 5_000],
    ]);
    const RedisCtor = jest.fn().mockImplementation(() => client);

    await jest.isolateModulesAsync(async () => {
      jest.doMock("ioredis", () => RedisCtor, { virtual: true });
      const { createRateLimiter, RedisRateLimiter: RedisClass } = await import(
        "../../../server/rate-limiter"
      );

      const limiter = await createRateLimiter({ max: 2, windowMs: 1_000 });
      expect(RedisCtor).toHaveBeenCalledWith("redis://localhost:6379");
      expect(limiter).toBeInstanceOf(RedisClass);
      await limiter.close();
    });
  });
});

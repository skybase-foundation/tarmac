import { describe, expect, it } from 'vitest';
import { normalizeSparkVaultPayload, type SparkVaultApiPayload } from './useSparkVaultApiData';

const VAULT = '0x74cb54e082411cfCAEADb00a0765625B10410DAa';

describe('normalizeSparkVaultPayload', () => {
  it('normalizes a representative payload into the rate/TVL/allocations shape', () => {
    const payload: SparkVaultApiPayload = {
      apy: 0.0531,
      totalAssets: '250000000000000', // 250M USDT (6 decimals)
      totalAssetsUsd: 250_000_000,
      allocations: [
        { name: 'Spark Liquidity Layer', assets: '200000000000000', assetsUsd: 200_000_000 },
        { name: 'Idle', assets: '50000000000000', assetsUsd: 50_000_000 }
      ]
    };

    const result = normalizeSparkVaultPayload(payload, VAULT);

    expect(result?.totalAssets).toBe(250000000000000n);
    expect(result?.totalAssetsUsd).toBe(250_000_000);
    // Spark surfaces a single net APY; gross == net, fees zeroed.
    expect(result?.rate?.rate).toBe(0.0531);
    expect(result?.rate?.netRate).toBe(0.0531);
    expect(result?.rate?.formattedNetRate).toBe('5.31%');
    expect(result?.rate?.address).toBe(VAULT);
    expect(result?.rate?.rewards).toEqual([]);
    // Spark has no market-API liquidity; left undefined so the UI shows "—".
    expect(result?.liquidity).toBeUndefined();
    expect(result?.allocations).toHaveLength(2);
    expect(result?.allocations?.[0]).toMatchObject({
      name: 'Spark Liquidity Layer',
      assets: 200000000000000n,
      assetsUsd: 200_000_000,
      allocationPercent: 0.8
    });
  });

  it('returns undefined for null/undefined or fully empty payloads', () => {
    expect(normalizeSparkVaultPayload(null, VAULT)).toBeUndefined();
    expect(normalizeSparkVaultPayload(undefined, VAULT)).toBeUndefined();
    expect(normalizeSparkVaultPayload({}, VAULT)).toBeUndefined();
  });

  it('maps partial payloads defensively, leaving absent fields undefined', () => {
    const rateOnly = normalizeSparkVaultPayload({ apy: 0.04 }, VAULT);
    expect(rateOnly?.rate?.formattedNetRate).toBe('4.00%');
    expect(rateOnly?.totalAssets).toBeUndefined();
    expect(rateOnly?.allocations).toBeUndefined();

    const tvlOnly = normalizeSparkVaultPayload({ totalAssets: '1000000' }, VAULT);
    expect(tvlOnly?.totalAssets).toBe(1000000n);
    expect(tvlOnly?.rate).toBeUndefined();
  });

  it('drops garbage numeric strings instead of throwing', () => {
    const result = normalizeSparkVaultPayload(
      {
        apy: 0.05,
        totalAssets: 'not-a-number',
        allocations: [
          { name: 'bad', assets: 'oops' },
          { name: 'good', assets: '100' }
        ]
      },
      VAULT
    );

    // Bad TVL is dropped to undefined; the rate still comes through.
    expect(result?.totalAssets).toBeUndefined();
    expect(result?.rate?.rate).toBe(0.05);
    // Only the parseable allocation survives; percent is undefined without a TVL.
    expect(result?.allocations).toHaveLength(1);
    expect(result?.allocations?.[0]).toMatchObject({ name: 'good', assets: 100n });
    expect(result?.allocations?.[0].allocationPercent).toBeUndefined();
  });

  it('ignores a NaN apy', () => {
    const result = normalizeSparkVaultPayload({ apy: NaN, totalAssets: '500' }, VAULT);
    expect(result?.rate).toBeUndefined();
    expect(result?.totalAssets).toBe(500n);
  });
});

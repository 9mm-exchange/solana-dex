export interface SwapResult {
    sourceAmountSwapped: bigint;
    destinationAmountSwapped: bigint;
    newSwapSourceAmount: bigint;
    newSwapDestinationAmount: bigint;
    protocolFee: bigint;
    fundFee: bigint;
}

export interface SwapParams {
    amountIn: bigint;
    totalInputTokenAmount: bigint;
    totalOutputTokenAmount: bigint;
    tradeFeeRate: number;
    protocolFeeRate: number;
    fundFeeRate: number;
}

export function swapBaseInput(params: SwapParams): SwapResult {
    const {
        amountIn,
        totalInputTokenAmount,
        totalOutputTokenAmount,
        tradeFeeRate,
        protocolFeeRate,
        fundFeeRate
    } = params;

    // Calculate fees
    const tradeFee = (amountIn * BigInt(tradeFeeRate)) / BigInt(10000);
    const protocolFee = (amountIn * BigInt(protocolFeeRate)) / BigInt(10000);
    const fundFee = (amountIn * BigInt(fundFeeRate)) / BigInt(10000);

    // Calculate actual amount after fees
    const actualAmountIn = amountIn - tradeFee - protocolFee - fundFee;

    // Calculate output amount using constant product formula
    const k = totalInputTokenAmount * totalOutputTokenAmount;
    const newSwapSourceAmount = totalInputTokenAmount + actualAmountIn;
    console.log("🚀 ~ swapBaseInput ~ newSwapSourceAmount:", newSwapSourceAmount)
    const newSwapDestinationAmount = k / newSwapSourceAmount;
    console.log("🚀 ~ swapBaseInput ~ newSwapDestinationAmount:", newSwapDestinationAmount)
    const destinationAmountSwapped = totalOutputTokenAmount - newSwapDestinationAmount;
    console.log("🚀 ~ swapBaseInput ~ destinationAmountSwapped:", destinationAmountSwapped)

    return {
        sourceAmountSwapped: actualAmountIn,
        destinationAmountSwapped,
        newSwapSourceAmount,
        newSwapDestinationAmount,
        protocolFee,
        fundFee
    };
}

// Helper function to convert numbers to bigint with proper decimal handling
export function toBigInt(amount: number, decimals: number): bigint {
    return BigInt(Math.floor(amount * Math.pow(10, decimals)));
}

// Helper function to convert bigint back to number with proper decimal handling
export function fromBigInt(amount: bigint, decimals: number): number {
    return Number(amount) / Math.pow(10, decimals);
}

export interface TokenMint {
    address: string;
    decimals: number;
}

export interface PoolState {
    token0Vault: string;
    token1Vault: string;
    token0Amount: bigint;
    token1Amount: bigint;
    tradeFeeRate: number;
    protocolFeeRate: number;
    fundFeeRate: number;
}

export async function calculateSwapResult(
    inputTokenMint: TokenMint,
    outputTokenMint: TokenMint,
    amountIn: number,
    poolState: PoolState
): Promise<{
    amountOut: number;
    priceImpact: number;
    fees: {
        trade: number;
        protocol: number;
        fund: number;
    };
}> {
    // Convert input amount to bigint with proper decimals
    const amountInBigInt = toBigInt(amountIn, inputTokenMint.decimals);

    // Determine which token is token0 and token1
    const isInputToken0 = inputTokenMint.address === poolState.token0Vault;
    
    // Get the correct amounts based on token order
    const totalInputTokenAmount = isInputToken0 ? poolState.token0Amount : poolState.token1Amount;
    const totalOutputTokenAmount = isInputToken0 ? poolState.token1Amount : poolState.token0Amount;

    // Calculate swap result
    const result = swapBaseInput({
        amountIn: amountInBigInt,
        totalInputTokenAmount,
        totalOutputTokenAmount,
        tradeFeeRate: poolState.tradeFeeRate,
        protocolFeeRate: poolState.protocolFeeRate,
        fundFeeRate: poolState.fundFeeRate
    });
    console.log("🚀 ~ result:", result)

    // Convert output amount back to number with proper decimals
    const amountOut = fromBigInt(result.destinationAmountSwapped, outputTokenMint.decimals);
    console.log("🚀 ~ amountOut:", amountOut)
    
    // Calculate price impact
    const priceBeforeSwap = Number(totalOutputTokenAmount) / Number(totalInputTokenAmount);
    const priceAfterSwap = Number(result.newSwapDestinationAmount) / Number(result.newSwapSourceAmount);
    const priceImpact = Math.abs((priceAfterSwap - priceBeforeSwap) / priceBeforeSwap * 100);

    // Convert fees to numbers with proper decimals
    const fees = {
        trade: fromBigInt((amountInBigInt * BigInt(poolState.tradeFeeRate)) / BigInt(10000), inputTokenMint.decimals),
        protocol: fromBigInt(result.protocolFee, inputTokenMint.decimals),
        fund: fromBigInt(result.fundFee, inputTokenMint.decimals)
    };

    return {
        amountOut,
        priceImpact,
        fees
    };
}

export interface DepositParams {
    token0Amount: bigint;
    totalToken0Amount: bigint;
    totalToken1Amount: bigint;
}

export function calculateToken1AmountForDeposit(params: DepositParams): bigint {
    const { token0Amount, totalToken0Amount, totalToken1Amount } = params;
    
    // Calculate the ratio of token0 contribution
    const ratio = (token0Amount * BigInt(1000000000)) / totalToken0Amount;
    
    // Calculate token1 amount based on the same ratio
    const token1Amount = (ratio * totalToken1Amount) / BigInt(1000000000);
    
    return token1Amount;
}

export async function calculateDepositAmounts(
    token0Mint: TokenMint,
    token1Mint: TokenMint,
    token0Amount: number,
    poolState: PoolState
): Promise<{
    token0Amount: number;
    token1Amount: number;
}> {
    // Convert input amount to bigint with proper decimals
    const token0AmountBigInt = toBigInt(token0Amount, token0Mint.decimals);
    
    // Calculate token1 amount
    const token1AmountBigInt = calculateToken1AmountForDeposit({
        token0Amount: token0AmountBigInt,
        totalToken0Amount: poolState.token0Amount,
        totalToken1Amount: poolState.token1Amount
    });
    
    // Convert amounts back to numbers with proper decimals
    return {
        token0Amount: fromBigInt(token0AmountBigInt, token0Mint.decimals),
        token1Amount: fromBigInt(token1AmountBigInt, token1Mint.decimals)
    };
}
